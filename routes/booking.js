const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  createBooking,
  getBookingById,
  getCustomerBookings,
  getAllBookings,
  processPayment,
  deleteBooking,
} = require("../controllers/bookingcontroller");

const router = express.Router();

// Admin routes first (before :id to avoid conflicts)
router.get("/admin/all", authMiddleware, getAllBookings);

// Protected routes
router.post("/", authMiddleware, createBooking);
router.post("/payment", authMiddleware, processPayment);
router.delete("/:id", authMiddleware, deleteBooking);
router.get("/:id", authMiddleware, getBookingById);
router.get("/customer/:customerId", authMiddleware, getCustomerBookings);

module.exports = router;
