/**
 * Migration: Create jobs table
 * 
 * TODO: Vector indexing (ivfflat/hnsw) skipped for now — will be needed before
 * Phase 3 similarity search at scale.
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
  pgm.createTable('jobs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    client_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE'
    },
    title: {
      type: 'varchar(255)',
      notNull: true
    },
    description: {
      type: 'text'
    },
    budget: {
      type: 'numeric(10,2)'
    },
    experience_requirement: {
      type: 'varchar(20)',
      check: "experience_requirement IN ('entry', 'intermediate', 'expert')"
    },
    embedding: {
      type: 'vector(384)'
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'open',
      check: "status IN ('open', 'closed', 'filled')"
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()')
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()')
    }
  });

  pgm.createIndex('jobs', 'status', { name: 'idx_jobs_status' });
  pgm.createIndex('jobs', 'client_id', { name: 'idx_jobs_client_id' });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('jobs');
};
