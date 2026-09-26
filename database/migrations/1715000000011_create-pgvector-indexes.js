/**
 * Migration: Create pgvector ivfflat indexes for profiles, jobs, and skills embeddings
 * 
 * Note: IVFFlat indexes are most effective when tables have a reasonable number of rows
 * already present to partition into lists. If any table has very few rows right now,
 * the index will still be created, but may require a REINDEX once more data accumulates.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.sql(
    'CREATE INDEX idx_profiles_embedding ON profiles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);'
  );
  pgm.sql(
    'CREATE INDEX idx_jobs_embedding ON jobs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);'
  );
  pgm.sql(
    'CREATE INDEX idx_skills_embedding ON skills USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);'
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.sql('DROP INDEX IF EXISTS idx_skills_embedding;');
  pgm.sql('DROP INDEX IF EXISTS idx_jobs_embedding;');
  pgm.sql('DROP INDEX IF EXISTS idx_profiles_embedding;');
};
