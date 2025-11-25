const db = require("./Config/db");

const updateCategories = async () => {
  try {
    // Update all events with NULL category to 'Music'
    const result = await db.sequelize.query(
      "UPDATE events SET category = 'Music' WHERE category IS NULL"
    );
    console.log("✅ All NULL categories updated to Music");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

updateCategories();
