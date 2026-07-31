const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getInvitationDetails, acceptInvitation } = require("../controllers/invitationController");

router.get("/:token", getInvitationDetails);              // public — show invite info
router.post("/:token/accept", protect, acceptInvitation); // requires login

module.exports = router;