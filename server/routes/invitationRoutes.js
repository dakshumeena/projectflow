const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { publicInviteLimiter } = require("../middleware/rateLimiter");
const { getInvitationDetails, acceptInvitation } = require("../controllers/invitationController");
router.get("/:token", publicInviteLimiter, getInvitationDetails); // public — show invite info
router.post("/:token/accept", protect, acceptInvitation); // requires login

module.exports = router;