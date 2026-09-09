/**
 * Migration: Create profiles table
 * Note: This single table serves both freelancer and client profiles for now,
 * distinguished by which fields are populated; revisit normalization later if needed.
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
  pgm.createTable('profiles', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      unique: true,
      references: 'users',
      onDelete: 'CASCADE'
    },
    full_name: {
      type: 'varchar(255)'
    },
    bio: {
      type: 'text'
    },
    description: {
      type: 'text' // profile description, later used as embedding input
    },
    location: {
      type: 'varchar(255)'
    },
    experience_level: {
      type: 'varchar(20)',
      check: "experience_level IN ('entry', 'intermediate', 'expert')"
    },
    years_of_experience: {
      type: 'integer'
    },
    portfolio_links: {
      type: 'text[]' // array of URLs
    },
    company_name: {
      type: 'varchar(255)' // for client profiles
    },
    industry: {
      type: 'varchar(100)' // for client profiles
    },
    embedding: {
      type: 'vector(384)'
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
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('profiles');
};
