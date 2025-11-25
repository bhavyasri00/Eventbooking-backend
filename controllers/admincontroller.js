const db = require("../Config/db");
const { Op } = require("sequelize");

const Event = db.Event;
const Booking = db.Booking;
const User = db.User;

// Approve event
const approveEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    await event.update({ status: "approved" });

    res.status(200).json({
      success: true,
      message: "Event approved successfully",
      event,
    });
  } catch (error) {
    console.error("Error approving event:", error);
    res.status(500).json({ error: "Failed to approve event" });
  }
};

// Get analytics
const getAnalytics = async (req, res) => {
  try {
    const totalEvents = await Event.count();
    const totalBookings = await Booking.count();
    const totalUsers = await User.count();

    const totalRevenue = await Booking.sum("amount", {
      where: { paymentStatus: "completed" },
    });

    const pendingEvents = await Event.count({ where: { status: "pending" } });

    res.status(200).json({
      success: true,
      analytics: {
        totalEvents,
        totalBookings,
        totalUsers,
        totalRevenue: totalRevenue || 0,
        pendingEvents,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};
// Get all users (NEW)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role", "createdAt", "updatedAt"],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

module.exports = {
  approveEvent,
  getAnalytics,
  getAllUsers,
};
