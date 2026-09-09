/**
 * Migration: Create user_skills join table
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
    'user_skills',
    {
      user_id: {
        type: 'uuid',
        notNull: true,
        references: 'users',
        onDelete: 'CASCADE'
      },
      skill_id: {
        type: 'uuid',
        notNull: true,
        references: 'skills',
        onDelete: 'CASCADE'
      },
      proficiency: {
        type: 'varchar(20)',
        default: 'intermediate',
        check: "proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')"
      }
    },
    {
      constraints: {
        primaryKey: ['user_id', 'skill_id']
      }
    }
  );

  pgm.createIndex('user_skills', 'skill_id', { name: 'idx_user_skills_skill_id' });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('user_skills');
};
