const db = require("../Config/db");

const CheckIn = db.CheckIn;
const Booking = db.Booking;
const Seat = db.Seat;

// Create check-in
const createCheckIn = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const staffId = req.user.id;

    // Verify booking exists
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Create check-in record
    const checkIn = await CheckIn.create({
      staffId,
      bookingId,
      timestamp: new Date(),
    });

    // Update booking status to checked_in
    const seatIds = await Seat.findAll({
      attributes: ["id"],
      where: {
        id: {
          [db.Sequelize.Op.in]: booking.seats || [],
        },
      },
    });

    if (seatIds.length > 0) {
      await Seat.update(
        { status: "checked_in" },
        { where: { id: seatIds.map((s) => s.id) } }
      );
    }

    res.status(201).json({
      success: true,
      message: "Customer checked in successfully",
      checkIn,
    });
  } catch (error) {
    console.error("Error creating check-in:", error);
    res.status(500).json({ error: "Failed to check in" });
  }
};

// Get event check-ins
const getEventCheckIns = async (req, res) => {
  try {
    const { eventId } = req.params;

    const checkIns = await CheckIn.findAll({
      include: [
        {
          model: Booking,
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
        {
          model: db.User,
          as: "staff",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["timestamp", "DESC"]],
    });

    console.log(`📊 Found ${checkIns.length} check-ins for event ${eventId}`);

    const mappedCheckIns = checkIns.map((checkIn) => {
      const booking = checkIn.booking;
      console.log(
        `Booking: ${booking?.bookingReference}, amount: "${
          booking?.amount
        }" (type: ${typeof booking?.amount})`
      );

      // Ensure amount is a proper number
      let amount = 0;
      if (booking?.amount !== null && booking?.amount !== undefined) {
        amount = parseFloat(booking.amount);
        if (isNaN(amount)) {
          amount = 0;
        }
      }

      console.log(`Final converted amount: ${amount}`);

      return {
        id: checkIn.id,
        bookingId: booking?.id,
        bookingReference: booking?.bookingReference,
        ticketId: booking?.ticketId,
        customerName: booking?.customer?.name,
        customerEmail: booking?.customer?.email,
        eventName: booking?.event?.name,
        eventDate: booking?.event?.date,
        totalSeats: booking?.totalSeats,
        amount: amount,
        checkInTime: checkIn.timestamp,
        staffName: checkIn.staff?.name,
        staffEmail: checkIn.staff?.email,
      };
    });

    console.log(
      `✅ Returning ${mappedCheckIns.length} mapped check-ins with amounts:`,
      mappedCheckIns.map((c) => ({ ref: c.bookingReference, amount: c.amount }))
    );

    res.status(200).json({
      success: true,
      checkIns: mappedCheckIns,
      count: mappedCheckIns.length,
    });
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    res.status(500).json({ error: "Failed to fetch check-ins" });
  }
};

// Verify and scan ticket
const scanTicket = async (req, res) => {
  try {
    const { ticketId } = req.body;
    const staffId = req.user.id;

    if (!ticketId) {
      return res.status(400).json({ error: "Ticket ID is required" });
    }

    console.log(`🔍 Searching for ticket: "${ticketId}"`);

    // Find booking by ticket ID
    const booking = await Booking.findOne({
      where: { ticketId },
      include: [
        {
          model: db.Event,
          as: "event",
          attributes: ["id", "name", "date", "venue"],
        },
        {
          model: db.User,
          as: "customer",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!booking) {
      console.log(`❌ Ticket not found: "${ticketId}"`);
      // Show all tickets in database for debugging
      const allTickets = await Booking.findAll({
        attributes: ["ticketId"],
        limit: 5,
      });
      console.log(
        "Available tickets:",
        allTickets.map((t) => t.ticketId)
      );

      return res.status(404).json({
        success: false,
        status: "invalid",
        message: "Invalid ticket ID - Ticket not found",
      });
    }

    console.log(`✅ Ticket found: ${booking.bookingReference}`);

    // Get current ticket status (handle null/undefined)
    const currentStatus = booking.ticketStatus || "valid";

    // Check ticket status
    if (currentStatus === "used" || currentStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        status: "already_used",
        message: `Ticket already ${currentStatus}`,
        booking: {
          id: booking.id,
          eventId: booking.eventId,
          bookingReference: booking.bookingReference,
          customerName: booking.customer.name,
          eventName: booking.event.name,
          ticketStatus: currentStatus,
        },
      });
    }

    // If already scanned, just return the existing check-in status (don't create duplicate)
    if (currentStatus === "scanned") {
      return res.status(200).json({
        success: true,
        status: "already_scanned",
        message: "Ticket already scanned",
        booking: {
          id: booking.id,
          eventId: booking.eventId,
          bookingReference: booking.bookingReference,
          customerName: booking.customer.name,
          eventName: booking.event.name,
          totalSeats: booking.totalSeats,
          ticketStatus: currentStatus,
          scannedAt: booking.updatedAt,
        },
      });
    }

    // Mark ticket as scanned (update will fail gracefully if column doesn't exist)
    try {
      await booking.update({ ticketStatus: "scanned" });
    } catch (updateError) {
      console.warn(
        "Warning: Could not update ticketStatus:",
        updateError.message
      );
    }

    // Create check-in record
    const checkIn = await CheckIn.create({
      staffId,
      bookingId: booking.id,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      status: "valid",
      message: "Ticket validated and scanned successfully",
      booking: {
        id: booking.id,
        eventId: booking.eventId,
        bookingReference: booking.bookingReference,
        customerName: booking.customer.name,
        eventName: booking.event.name,
        totalSeats: booking.totalSeats,
        amount: booking.amount,
        ticketStatus: "scanned",
        scannedAt: new Date(),
        scannedBy: staffId,
      },
    });
  } catch (error) {
    console.error("Error scanning ticket:", error);
    console.error("Error stack:", error.stack);
    console.error("Error message:", error.message);
    res.status(500).json({
      success: false,
      status: "error",
      error: "Failed to scan ticket",
      details: error.message,
    });
  }
};

// Get ticket status
const getTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;

    if (!ticketId) {
      return res.status(400).json({ error: "Ticket ID is required" });
    }

    const booking = await Booking.findOne({
      where: { ticketId },
      attributes: [
        "id",
        "bookingReference",
        "totalSeats",
        "amount",
        "ticketStatus",
        "createdAt",
        "updatedAt",
      ],
      include: [
        {
          model: db.Event,
          as: "event",
          attributes: ["id", "name", "date"],
        },
        {
          model: db.User,
          as: "customer",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        status: "invalid",
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      status: booking.ticketStatus,
      ticket: {
        ticketId,
        bookingReference: booking.bookingReference,
        customerName: booking.customer.name,
        eventName: booking.event.name,
        eventDate: booking.event.date,
        totalSeats: booking.totalSeats,
        amount: booking.amount,
        ticketStatus: booking.ticketStatus,
        bookedAt: booking.createdAt,
        scannedAt: booking.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching ticket status:", error);
    res.status(500).json({ error: "Failed to fetch ticket status" });
  }
};

module.exports = {
  createCheckIn,
  getEventCheckIns,
  scanTicket,
  getTicketStatus,
};
