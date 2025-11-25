"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("events", "layout", Sequelize.JSON);
    await queryInterface.addColumn("events", "prices", Sequelize.JSON);
    await queryInterface.addColumn("events", "capacity", Sequelize.INTEGER);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("events", "layout");
    await queryInterface.removeColumn("events", "prices");
    await queryInterface.removeColumn("events", "capacity");
  },
};
