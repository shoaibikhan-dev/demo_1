'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('complaints', ['category'], {
      name: 'idx_complaints_category'
    });
    await queryInterface.addIndex('complaints', ['createdAt'], {
      name: 'idx_complaints_createdat'
    });
    await queryInterface.addIndex('complaints', ['resolvedAt'], {
      name: 'idx_complaints_resolvedat'
    });
    await queryInterface.addIndex('users', ['cnic'], {
      name: 'idx_users_cnic'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('complaints', 'idx_complaints_category');
    await queryInterface.removeIndex('complaints', 'idx_complaints_createdat');
    await queryInterface.removeIndex('complaints', 'idx_complaints_resolvedat');
    await queryInterface.removeIndex('users', 'idx_users_cnic');
  }
};
