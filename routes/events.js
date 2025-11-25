const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const {
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
} = require("../controllers/eventController");

const upload = require("../middleware/multerconfig"); // 👈 Import Multer config

const router = express.Router();

// Organizer routes (protected) - MUST come before /:id to avoid conflicts
router.get(
  "/organizer/events",
  authMiddleware,
  roleMiddleware("organizer", "admin"),
  getOrganizerEvents
);

router.get(
  "/organizer/stats",
  authMiddleware,
  roleMiddleware("organizer", "admin"),
  getOrganizerStats
);

// Get events by status (for admin to view pending events)
router.get("/status/:status", getEventsByStatus);

// Public routes
router.get("/", getAllEvents);
router.get("/:id", getEventById);

// Organizer/Admin routes
router.post(
  "/",
  authMiddleware,
  roleMiddleware("organizer", "admin"),
  upload.single("image"), // 👈 Added for uploading image
  createEvent
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("organizer", "admin"),
  upload.single("image"), // 👈 Added for updating image
  updateEvent
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("organizer", "admin"),
  deleteEvent
);

// Admin approval routes
router.patch(
  "/:id/approve",
  authMiddleware,
  roleMiddleware("admin"),
  approveEvent
);

router.patch(
  "/:id/reject",
  authMiddleware,
  roleMiddleware("admin"),
  rejectEvent
);

module.exports = router;
