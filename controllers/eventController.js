const db = require("../Config/db");

const Event = db.Event;
const User = db.User;

// Get all approved events (public)
const getAllEvents = async (req, res) => {
  try {
    const { category } = req.query;
    
    const query = {
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["id", "name", "email"],
        },
      ],
      where: { status: "approved" },
    };

    // If category filter is provided and not "All Events", add it to the query
    if (category && category !== "All Events" && category !== "all") {
      query.where.category = category;
    }

    const events = await Event.findAll(query);

    res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
};

// Get single event
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["id", "name", "email"],
        },
        {
          model: db.Seat,
          as: "seats",
        },
      ],
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Failed to fetch event" });
  }
};

// Get events by status (Admin - pending/approved/rejected)
const getEventsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    if (!["pending", "approved", "rejected", "all"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const query = {
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["id", "name", "email"],
        },
      ],
    };

    if (status !== "all") {
      query.where = { status };
    }

    const events = await Event.findAll(query);

    res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Error fetching status events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
};

// Create event with Image upload (Organizer only)
const createEvent = async (req, res) => {
  try {
    console.log("[createEvent] req.user:", req.user);
    const { name, description, date, venue, category } = req.body;
    const organizerId = req.user?.id;

    if (!name || !date || !venue) {
      return res
        .status(400)
        .json({ error: "Name, date, and venue are required" });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const event = await Event.create({
      organizerId,
      name,
      description,
      image: imageUrl,
      date,
      venue,
      category,
      status: "pending", // Requires admin approval
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully, pending approval",
      event,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
};

// Update event (Organizer/Admin)
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.organizerId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        error: "You can only update your own events",
      });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : event.image;

    await event.update({
      name: req.body.name || event.name,
      description: req.body.description || event.description,
      date: req.body.date || event.date,
      venue: req.body.venue || event.venue,
      category: req.body.category || event.category,
      image: imageUrl,
    });

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.organizerId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        error: "You can only delete your own events",
      });
    }

    await event.destroy();

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
};

// Approve event - Admin
const approveEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);

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

// Reject event - Admin
const rejectEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    await event.update({ status: "rejected" });

    res.status(200).json({
      success: true,
      message: "Event rejected successfully",
      reason,
      event,
    });
  } catch (error) {
    console.error("Error rejecting event:", error);
    res.status(500).json({ error: "Failed to reject event" });
  }
};

// Organizer Stats
const getOrganizerStats = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const events = await Event.findAll({
      where: { organizerId },
      attributes: ["id", "name"],
    });

    const eventIds = events.map((e) => e.id);

    if (eventIds.length === 0) {
      return res.status(200).json({
        success: true,
        stats: {
          totalEvents: 0,
          ticketsSold: 0,
          totalRevenue: 0,
          soldOutEvents: 0,
        },
      });
    }

    // Get all bookings for organizer's events
    const bookings = await db.Booking.findAll({
      where: {
        eventId: {
          [db.Sequelize.Op.in]: eventIds,
        },
        paymentStatus: "completed",
      },
      attributes: ["totalSeats", "amount", "eventId"],
      raw: true,
    });

    // Get seat info to determine sold-out events
    const allSeats = await db.Seat.findAll({
      where: {
        eventId: {
          [db.Sequelize.Op.in]: eventIds,
        },
      },
      attributes: ["eventId", "status"],
      raw: true,
    });

    // Count sold-out events (where all seats are sold)
    const eventSeatCounts = {};
    const eventSoldCounts = {};

    allSeats.forEach((seat) => {
      eventSeatCounts[seat.eventId] = (eventSeatCounts[seat.eventId] || 0) + 1;
      if (seat.status === "sold") {
        eventSoldCounts[seat.eventId] =
          (eventSoldCounts[seat.eventId] || 0) + 1;
      }
    });

    let soldOutEvents = 0;
    Object.keys(eventSeatCounts).forEach((eventId) => {
      if (eventSoldCounts[eventId] === eventSeatCounts[eventId]) {
        soldOutEvents++;
      }
    });

    const ticketsSold = bookings.reduce(
      (sum, b) => sum + (b.totalSeats || 0),
      0
    );
    const totalRevenue = bookings.reduce(
      (sum, b) => sum + (parseFloat(b.amount) || 0),
      0
    );

    res.status(200).json({
      success: true,
      stats: {
        totalEvents: events.length,
        ticketsSold,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        soldOutEvents,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

// Organizer's Events List
const getOrganizerEvents = async (req, res) => {
  try {
    const organizerId = req.user?.id;

    const events = await Event.findAll({
      where: { organizerId },
      attributes: ["id", "name", "date", "venue", "status", "createdAt"],
      order: [["date", "DESC"]],
    });

    const eventsWithDetails = await Promise.all(
      events.map(async (event) => {
        // Get completed bookings for this event
        const bookings = await db.Booking.findAll({
          where: {
            eventId: event.id,
            paymentStatus: "completed",
          },
          attributes: ["totalSeats", "amount"],
          raw: true,
        });

        // Get seat information
        const seats = await db.Seat.findAll({
          where: { eventId: event.id },
          attributes: ["id", "status"],
          raw: true,
        });

        const ticketsSold = bookings.reduce(
          (sum, b) => sum + (b.totalSeats || 0),
          0
        );
        const revenue = bookings.reduce(
          (sum, b) => sum + (parseFloat(b.amount) || 0),
          0
        );

        // Check if event is sold out
        const totalSeats = seats.length;
        const soldSeats = seats.filter((s) => s.status === "sold").length;
        const isSoldOut = totalSeats > 0 && soldSeats === totalSeats;

        return {
          id: event.id,
          name: event.name,
          date: event.date,
          venue: event.venue,
          status: event.status,
          ticketsSold,
          revenue: parseFloat(revenue.toFixed(2)),
          totalSeats,
          soldSeats,
          isSoldOut,
        };
      })
    );

    res.status(200).json({
      success: true,
      events: eventsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching organizer events:", error);
    res.status(500).json({ error: "Failed to fetch organizer events" });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByStatus,
  approveEvent,
  rejectEvent,
  getOrganizerStats,
  getOrganizerEvents,
};
