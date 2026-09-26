const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { pgPool } = require('../src/config/db.config');
const { ML_SERVICE_URL } = require('../src/config/env.config');

async function backfill() {
  console.log(`[Backfill] Starting skill embedding backfill against ML Service at ${ML_SERVICE_URL}...`);
  const { rows: skills } = await pgPool.query('SELECT id, name FROM skills WHERE embedding IS NULL ORDER BY name ASC;');

  if (skills.length === 0) {
    console.log('[Backfill] No skills found with missing embeddings. All up to date.');
    await pgPool.end();
    return;
  }

  console.log(`[Backfill] Found ${skills.length} skill(s) requiring embeddings.`);
  let successCount = 0;
  let failCount = 0;

  for (const skill of skills) {
    try {
      const response = await fetch(`${ML_SERVICE_URL}/embeddings/skill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: skill.id,
          name: skill.name,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Backfill] Failed for skill '${skill.name}' (${skill.id}): HTTP ${response.status} - ${errText}`);
        failCount++;
      } else {
        const result = await response.json();
        console.log(`[Backfill] Successfully embedded skill '${skill.name}' (${skill.id}): dimensions=${result.dimensions}`);
        successCount++;
      }
    } catch (err) {
      console.error(`[Backfill] Network error for skill '${skill.name}' (${skill.id}): ${err.message}`);
      failCount++;
    }
  }

  console.log(`[Backfill] Completed: ${successCount} succeeded, ${failCount} failed.`);
  await pgPool.end();
}

backfill().catch((err) => {
  console.error('[Backfill] Unexpected error:', err);
  process.exit(1);
});
