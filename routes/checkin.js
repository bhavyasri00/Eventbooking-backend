const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const {
  createCheckIn,
  getEventCheckIns,
  scanTicket,
  getTicketStatus,
} = require("../controllers/checkincontroller");

const router = express.Router();

// Staff scan ticket endpoint
router.post(
  "/scan",
  authMiddleware,
  roleMiddleware("staff", "admin"),
  scanTicket
);

// Get ticket status (public - no auth required)
router.get("/ticket/:ticketId", getTicketStatus);

// Create check-in
router.post(
  "/",
  authMiddleware,
  roleMiddleware("staff", "admin"),
  createCheckIn
);

// Get event check-ins
router.get(
  "/event/:eventId",
  authMiddleware,
  roleMiddleware("staff", "admin"),
  getEventCheckIns
);

// Debug endpoint - list all tickets (remove in production)
router.get("/debug/all-tickets", authMiddleware, async (req, res) => {
  try {
    const db = require("../Config/db");
    const bookings = await db.Booking.findAll({
      attributes: [
        "id",
        "ticketId",
        "bookingReference",
        "totalSeats",
        "amount",
        "eventId",
      ],
      limit: 20,
    });
    res.json({ count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint - check event bookings with amounts
router.get("/debug/event/:eventId", authMiddleware, async (req, res) => {
  try {
    const db = require("../Config/db");
    const { eventId } = req.params;
    const bookings = await db.Booking.findAll({
      where: { eventId },
      attributes: [
        "id",
        "ticketId",
        "bookingReference",
        "totalSeats",
        "amount",
        "eventId",
      ],
    });
    res.json({
      eventId,
      count: bookings.length,
      bookings,
      sampleAmount: bookings[0]?.amount,
      sampleAmountType: typeof bookings[0]?.amount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint - detailed check-in response for event
router.get(
  "/debug/event-checkins/:eventId",
  authMiddleware,
  async (req, res) => {
    try {
      const db = require("../Config/db");
      const { eventId } = req.params;

      const checkIns = await db.CheckIn.findAll({
        include: [
          {
            model: db.Booking,
            where: { eventId },
            attributes: [
              "id",
              "customerId",
              "eventId",
              "totalSeats",
              "amount",
              "bookingReference",
              "ticketId",
              "ticketStatus",
            ],
            include: [
              {
                model: db.User,
                as: "customer",
                attributes: ["id", "name", "email"],
              },
              {
                model: db.Event,
                as: "event",
                attributes: ["id", "name", "date"],
              },
            ],
          },
        ],
        limit: 10,
      });

      res.json({
        totalCheckIns: checkIns.length,
        checkIns: checkIns.map((c) => ({
          checkInId: c.id,
          bookingId: c.booking?.id,
          bookingRef: c.booking?.bookingReference,
          rawAmount: c.booking?.amount,
          amountType: typeof c.booking?.amount,
          amountValue: parseFloat(c.booking?.amount) || 0,
          customerName: c.booking?.customer?.name,
          eventName: c.booking?.event?.name,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Fix endpoint - set missing amounts for bookings
router.post("/debug/fix-amounts", authMiddleware, async (req, res) => {
  try {
    const db = require("../Config/db");

    // Update all bookings with null/0 amounts
    const bookings = await db.Booking.findAll({
      attributes: ["id", "totalSeats", "amount"],
      where: {
        [db.Sequelize.Op.or]: [{ amount: null }, { amount: 0 }],
      },
    });

    console.log(`Found ${bookings.length} bookings with zero/null amounts`);

    let fixed = 0;
    for (const booking of bookings) {
      const newAmount = (booking.totalSeats || 1) * 100;
      await booking.update({ amount: newAmount });
      fixed++;
    }

    res.json({
      message: `Fixed ${fixed} bookings`,
      fixed: fixed,
      totalAffected: bookings.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Full diagnostic endpoint
router.get("/debug/full-diagnostic", authMiddleware, async (req, res) => {
  try {
    const db = require("../Config/db");

    // Get all bookings by event
    const bookings = await db.Booking.findAll({
      attributes: ["id", "eventId", "bookingReference", "totalSeats", "amount"],
      include: [
        {
          model: db.Event,
          as: "event",
          attributes: ["id", "name"],
        },
      ],
      limit: 20,
    });

    // Get all check-ins
    const checkIns = await db.CheckIn.findAll({
      attributes: ["id", "bookingId"],
      limit: 20,
    });

    // Group check-ins by event
    const bookingsByEvent = {};
    bookings.forEach((b) => {
      const eventId = b.eventId;
      if (!bookingsByEvent[eventId]) {
        bookingsByEvent[eventId] = {
          eventName: b.event?.name,
          bookings: [],
          checkedIn: 0,
        };
      }
      bookingsByEvent[eventId].bookings.push({
        ref: b.bookingReference,
        amount: b.amount,
        seats: b.totalSeats,
      });
    });

    // Count check-ins by booking
    checkIns.forEach((ci) => {
      const booking = bookings.find((b) => b.id === ci.bookingId);
      if (booking) {
        bookingsByEvent[booking.eventId].checkedIn++;
      }
    });

    res.json({
      totalBookings: bookings.length,
      totalCheckIns: checkIns.length,
      byEvent: bookingsByEvent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
