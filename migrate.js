#!/usr/bin/env node
require("dotenv").config();
const { Sequelize } = require("sequelize");
const path = require("path");

async function runMigration() {
  try {
    console.log("🔄 Starting migration...");

    const sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      ssl: true,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    });

    // Test connection
    await sequelize.authenticate();
    console.log("✅ Database connected successfully!");

    // Add ticket_id column
    try {
      await sequelize.query(`
        ALTER TABLE bookings 
        ADD COLUMN IF NOT EXISTS ticket_id VARCHAR(100) UNIQUE
      `);
      console.log("✅ Added ticket_id column");
    } catch (err) {
      console.log("⚠️  ticket_id column: " + err.message);
    }

    // Add ticket_status column
    try {
      await sequelize.query(`
        ALTER TABLE bookings 
        ADD COLUMN IF NOT EXISTS ticket_status VARCHAR(50) DEFAULT 'valid'
      `);
      console.log("✅ Added ticket_status column");
    } catch (err) {
      console.log("⚠️  ticket_status column: " + err.message);
    }

    // Add category column to events
    try {
      await sequelize.query(`
        ALTER TABLE events 
        ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT NULL
      `);
      console.log("✅ Added category column");
    } catch (err) {
      console.log("⚠️  category column: " + err.message);
    }

    console.log("✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

runMigration();
