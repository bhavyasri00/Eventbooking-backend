const db = require("../Config/db");

const Seat = db.Seat;
const Event = db.Event;

// Get all seats for an event
const getEventSeats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const seats = await Seat.findAll({
      where: { eventId },
      order: [["seatId", "ASC"]],
    });

    if (seats.length === 0) {
      return res.status(404).json({ error: "No seats found for this event" });
    }

    res.status(200).json({
      success: true,
      seats,
    });
  } catch (error) {
    console.error("Error fetching seats:", error);
    res.status(500).json({ error: "Failed to fetch seats" });
  }
};

// Lock seat (Reserve temporarily)
const lockSeat = async (req, res) => {
  try {
    const { seatId, eventId } = req.body;
    const customerId = req.user.id;

    const seat = await Seat.findOne({
      where: { id: seatId, eventId },
    });

    if (!seat) {
      return res.status(404).json({ error: "Seat not found" });
    }

    if (seat.status !== "available") {
      return res.status(400).json({ error: `Seat is ${seat.status}` });
    }

    await seat.update({
      status: "locked",
      lockedBy: customerId,
      lockedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Seat locked successfully",
      seat,
    });
  } catch (error) {
    console.error("Error locking seat:", error);
    res.status(500).json({ error: "Failed to lock seat" });
  }
};

// Unlock seat (Release temporary hold)
const unlockSeat = async (req, res) => {
  try {
    const { seatId } = req.body;

    const seat = await Seat.findByPk(seatId);

    if (!seat) {
      return res.status(404).json({ error: "Seat not found" });
    }

    if (seat.status !== "locked") {
      return res.status(400).json({ error: "Seat is not locked" });
    }

    await seat.update({
      status: "available",
      lockedBy: null,
      lockedAt: null,
    });

    res.status(200).json({
      success: true,
      message: "Seat unlocked successfully",
      seat,
    });
  } catch (error) {
    console.error("Error unlocking seat:", error);
    res.status(500).json({ error: "Failed to unlock seat" });
  }
};

// Mark seats as sold
const markSeatsSold = async (req, res) => {
  try {
    const { eventId, seatIds } = req.body;

    if (!eventId || !seatIds || seatIds.length === 0) {
      return res.status(400).json({
        error: "Missing required fields: eventId, seatIds",
      });
    }

    const updated = await Seat.update(
      { status: "sold" },
      {
        where: {
          eventId: eventId,
          seatId: seatIds,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: `${updated[0]} seats marked as sold`,
      updatedCount: updated[0],
    });
  } catch (error) {
    console.error("Error marking seats as sold:", error);
    res.status(500).json({ error: "Failed to mark seats as sold" });
  }
};

// Get booked/sold seats for an event
const getBookedSeats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const bookedSeats = await Seat.findAll({
      where: {
        eventId: eventId,
        status: ["sold", "checked_in"],
      },
      attributes: ["id", "seatId", "section", "price", "status"],
      order: [["seatId", "ASC"]],
    });

    res.status(200).json({
      success: true,
      bookedSeatsCount: bookedSeats.length,
      bookedSeats: bookedSeats.map((seat) => seat.seatId),
      details: bookedSeats,
    });
  } catch (error) {
    console.error("Error fetching booked seats:", error);
    res.status(500).json({ error: "Failed to fetch booked seats" });
  }
};

module.exports = {
  getEventSeats,
  lockSeat,
  unlockSeat,
  markSeatsSold,
  getBookedSeats,
};