const db = require("../Config/db");
const { generateQRCode } = require("../utils/qrCode");

const Booking = db.Booking;
const Seat = db.Seat;
const Event = db.Event;
const User = db.User;

// Create booking
const createBooking = async (req, res) => {
  try {
    let { customerId, eventId, seats, numberOfSeats, totalAmount } = req.body;

    console.log("Creating booking with data:", {
      customerId,
      eventId,
      seats,
      numberOfSeats,
      totalAmount,
    });

    // Handle different input formats
    if (!seats && numberOfSeats) {
      // If only numberOfSeats is provided, create an array
      seats = Array(numberOfSeats)
        .fill(null)
        .map((_, i) => `Seat${i + 1}`);
    }

    if (typeof seats === "string") {
      // Convert single seat string or comma-separated string to array
      seats = seats
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
    }

    if (!customerId || !eventId || !seats || seats.length === 0) {
      console.log("Validation failed:", { customerId, eventId, seats });
      return res.status(400).json({
        error: "Missing required fields: customerId, eventId, seats",
      });
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      console.log("Event not found for ID:", eventId);
      return res.status(404).json({ error: "Event not found" });
    }

    // Use the exact amount from frontend, or calculate if not provided
    const finalAmount = totalAmount || seats.length * 100;

    // Generate unique booking reference (e.g., BK-2025-1234567890)
    const bookingReference = `BK-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    // Generate unique ticket ID (e.g., TKT-ABC123XYZ789)
    const ticketId = `TKT-${Math.random()
      .toString(36)
      .substr(2, 15)
      .toUpperCase()}`;

    console.log("Creating booking with:", {
      customerId,
      eventId,
      totalSeats: seats.length,
      amount: finalAmount,
      bookingReference,
      ticketId,
    });

    const booking = await Booking.create({
      customerId,
      eventId,
      totalSeats: seats.length,
      amount: finalAmount,
      bookingReference,
      ticketId,
      paymentStatus: "completed",
    });

    console.log("Booking created successfully:", booking.toJSON());

    // Mark selected seats as sold
    try {
      const updatedSeats = await Seat.update(
        { status: "sold" },
        {
          where: {
            eventId: eventId,
            seatId: seats,
          },
        }
      );
      console.log(`✅ Updated ${updatedSeats[0]} seat(s) to sold:`, seats);

      // If no seats were updated, try to see what seats exist
      if (updatedSeats[0] === 0) {
        const existingSeats = await Seat.findAll({
          where: { eventId: eventId },
          attributes: ["id", "seatId", "status"],
          limit: 5,
        });
        console.warn(
          "⚠️ No seats matched. Event seats:",
          existingSeats.map((s) => s.seatId)
        );
      }
    } catch (seatError) {
      console.warn(
        "⚠️ Warning: Could not mark seats as sold:",
        seatError.message
      );
      // Don't fail the booking if seat marking fails
    }

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking: booking.toJSON(),
    });
  } catch (error) {
    console.error("❌ ERROR in createBooking:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    console.error("Error stack:", error.stack);

    res.status(500).json({
      error: "Failed to create booking",
      details: error.message,
      errorName: error.name,
      errorCode: error.code,
    });
  }
};

// Get single booking
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByPk(id, {
      include: [
        { model: User, as: "customer", attributes: ["id", "name", "email"] },
        { model: Event, as: "event" },
      ],
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
};

// Get customer bookings
const getCustomerBookings = async (req, res) => {
  try {
    const { customerId } = req.params;

    const bookings = await Booking.findAll({
      where: { customerId },
      include: [{ model: Event, as: "event" }],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching customer bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

// Get all bookings (for admin)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        { model: User, as: "customer", attributes: ["id", "name", "email"] },
        { model: Event, as: "event", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

// Process payment
const processPayment = async (req, res) => {
  try {
    const { bookingId, amount, cardholderName, cardNumber } = req.body;

    console.log("Payment request received:", {
      bookingId,
      amount,
      cardholderName,
    });

    // Validate input
    if (!bookingId || !amount) {
      console.log("Missing fields - bookingId:", bookingId, "amount:", amount);
      return res.status(400).json({
        error: "Missing required fields: bookingId, amount",
      });
    }

    // Find booking
    const booking = await Booking.findByPk(bookingId);
    console.log("Booking found:", booking);

    if (!booking) {
      console.log("Booking not found with ID:", bookingId);
      return res.status(404).json({ error: "Booking not found" });
    }

    // Mock payment processing - simulate payment gateway
    const isPaymentSuccessful = Math.random() > 0.1; // 90% success rate for demo
    console.log("Payment success:", isPaymentSuccessful);

    if (!isPaymentSuccessful) {
      return res.status(400).json({
        error: "Payment declined. Please try again or use a different card.",
      });
    }

    // Update booking payment status
    const updatedBooking = await Booking.update(
      { paymentStatus: "completed" },
      { where: { id: bookingId }, returning: true }
    );

    console.log("Booking updated successfully");

    res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      booking: { id: bookingId, paymentStatus: "completed" },
      transactionId:
        "TXN_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
    });
  } catch (error) {
    console.error("Error processing payment:", error.message);
    console.error("Full error stack:", error.stack);
    console.error("Error details:", JSON.stringify(error, null, 2));
    res.status(500).json({
      error: "Payment processing failed",
      details: error.message,
    });
  }
};

// Delete booking
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findByPk(id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Only allow customer or admin to delete
    if (booking.customerId !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "You can only delete your own bookings" });
    }

    await booking.destroy();

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Failed to delete booking" });
  }
};

module.exports = {
  createBooking,
  getBookingById,
  getCustomerBookings,
  getAllBookings,
  processPayment,
  deleteBooking,
};
