const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const {
  approveEvent,
  getAnalytics,
  getAllUsers,
} = require("../controllers/admincontroller");

const router = express.Router();

router.put(
  "/event/:eventId/approve",
  authMiddleware,
  roleMiddleware("admin"),
  approveEvent
);
router.get("/analytics", authMiddleware, roleMiddleware("admin"), getAnalytics);
router.get("/users/all", authMiddleware, roleMiddleware("admin"), getAllUsers);

module.exports = router;
