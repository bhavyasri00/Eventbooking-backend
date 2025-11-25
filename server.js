const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./Config/db");

// Import routes
const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const seatRoutes = require("./routes/seats");
const bookingRoutes = require("./routes/booking");
const checkinRoutes = require("./routes/checkin");
const adminRoutes = require("./routes/admin");
const uploadRoutes = require("./routes/upload");

// Import middleware
// const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// Middleware
// Middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Serve uploaded images publicly
app.use("/uploads", express.static("uploads"));
//Increase payload limits to handle large images
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  if (req.method === "POST" || req.method === "PUT") {
    console.log("Body:", JSON.stringify(req.body, null, 2));
  }
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/checkin", checkinRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is running", status: "OK" });
});

// Error handling middleware
// app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Database connection and server start
const PORT = process.env.PORT || 5000;

db.sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected successfully!");

    // Sync models with database (set force: false in production)
    return db.sequelize.sync({ alter: false });
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

module.exports = app;
