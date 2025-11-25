"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Set default category to "Music" for events that don't have a category
    await queryInterface.sequelize.query(
      `UPDATE events SET category = 'Music' WHERE category IS NULL`
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Revert: set category back to NULL for events that were "Music"
    await queryInterface.sequelize.query(
      `UPDATE events SET category = NULL WHERE category = 'Music'`
    );
  },
};
