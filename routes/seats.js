const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  getEventSeats,
  lockSeat,
  unlockSeat,
  markSeatsSold,
  getBookedSeats,
} = require("../controllers/seatController");

const router = express.Router();

router.get("/event/:eventId", getEventSeats);
router.get("/booked/:eventId", getBookedSeats);
router.post("/lock", authMiddleware, lockSeat);
router.post("/unlock", authMiddleware, unlockSeat);
router.post("/mark-sold", authMiddleware, markSeatsSold);

module.exports = router;