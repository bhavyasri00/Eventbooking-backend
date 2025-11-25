"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add ticket_id column if it doesn't exist
    try {
      await queryInterface.addColumn("bookings", "ticket_id", {
        type: Sequelize.STRING(100),
        unique: true,
        allowNull: true,
      });
      console.log("✅ Added ticket_id column to bookings table");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("⚠️  ticket_id column already exists");
      } else {
        console.error("❌ Error adding ticket_id:", error.message);
      }
    }

    // Add ticket_status column if it doesn't exist
    try {
      await queryInterface.addColumn("bookings", "ticket_status", {
        type: Sequelize.ENUM("valid", "scanned", "used", "cancelled"),
        defaultValue: "valid",
      });
      console.log("✅ Added ticket_status column to bookings table");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("⚠️  ticket_status column already exists");
      } else {
        console.error("❌ Error adding ticket_status:", error.message);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Rollback: remove columns if needed
    try {
      await queryInterface.removeColumn("bookings", "ticket_id");
      await queryInterface.removeColumn("bookings", "ticket_status");
      console.log("✅ Removed ticket_id and ticket_status columns");
    } catch (error) {
      console.error("❌ Error removing columns:", error.message);
    }
  },
};
