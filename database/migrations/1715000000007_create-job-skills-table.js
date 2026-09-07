/**
 * Migration: Create job_skills join table
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable(
    'job_skills',
    {
      job_id: {
        type: 'uuid',
        notNull: true,
        references: 'jobs',
        onDelete: 'CASCADE'
      },
      skill_id: {
        type: 'uuid',
        notNull: true,
        references: 'skills',
        onDelete: 'CASCADE'
      }
    },
    {
      constraints: {
        primaryKey: ['job_id', 'skill_id']
      }
    }
  );

  pgm.createIndex('job_skills', 'skill_id', { name: 'idx_job_skills_skill_id' });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('job_skills');
};
