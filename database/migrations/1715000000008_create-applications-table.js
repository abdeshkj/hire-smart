/**
 * Migration: Create applications table
 * (Schema only at this stage — full apply/proposal workflow comes in Phase 4)
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
  pgm.createTable(
    'applications',
    {
      id: {
        type: 'uuid',
        primaryKey: true,
        default: pgm.func('gen_random_uuid()')
      },
      job_id: {
        type: 'uuid',
        notNull: true,
        references: 'jobs',
        onDelete: 'CASCADE'
      },
      freelancer_id: {
        type: 'uuid',
        notNull: true,
        references: 'users',
        onDelete: 'CASCADE'
      },
      proposal: {
        type: 'text'
      },
      status: {
        type: 'varchar(20)',
        notNull: true,
        default: 'pending',
        check: "status IN ('pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn')"
      },
      outcome: {
        type: 'varchar(20)' // nullable, filled in later for training data (e.g., 'hired', 'not_hired')
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
    },
    {
      constraints: {
        unique: ['job_id', 'freelancer_id']
      }
    }
  );

  pgm.createIndex('applications', 'status', { name: 'idx_applications_status' });
  pgm.createIndex('applications', 'job_id', { name: 'idx_applications_job_id' });
  pgm.createIndex('applications', 'freelancer_id', { name: 'idx_applications_freelancer_id' });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('applications');
};
