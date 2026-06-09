'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id:        { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name:      { type: Sequelize.STRING(100), allowNull: false },
      email:     { type: Sequelize.STRING(150), allowNull: false, unique: true },
      password:  { type: Sequelize.STRING, allowNull: false },
      cnic:      { type: Sequelize.STRING(20), unique: true },
      phone:     { type: Sequelize.STRING(20) },
      role:      { type: Sequelize.STRING(10), defaultValue: 'citizen' },
      isActive:  { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('complaints', {
      id:           { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      title:        { type: Sequelize.STRING(200), allowNull: false },
      description:  { type: Sequelize.TEXT, allowNull: false },
      category:     { type: Sequelize.STRING(100), allowNull: false },
      status:       { type: Sequelize.STRING(20), defaultValue: 'pending' },
      priority:     { type: Sequelize.STRING(10), defaultValue: 'medium' },
      location:     { type: Sequelize.STRING(255) },
      imageUrl:     { type: Sequelize.STRING },
      adminNote:    { type: Sequelize.TEXT },
      trackingId:   { type: Sequelize.STRING(20), unique: true },
      resolvedAt:   { type: Sequelize.DATE },
      userId:       { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      createdAt:    { type: Sequelize.DATE, allowNull: false },
      updatedAt:    { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('notifications', {
      id:        { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      title:     { type: Sequelize.STRING(200), allowNull: false },
      message:   { type: Sequelize.TEXT, allowNull: false },
      type:      { type: Sequelize.STRING(20), defaultValue: 'info' },
      isRead:    { type: Sequelize.BOOLEAN, defaultValue: false },
      userId:    { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('complaints', ['userId']);
    await queryInterface.addIndex('complaints', ['status']);
    await queryInterface.addIndex('complaints', ['trackingId']);
    await queryInterface.addIndex('notifications', ['userId']);
    await queryInterface.addIndex('users', ['email']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('complaints');
    await queryInterface.dropTable('users');
  },
};
