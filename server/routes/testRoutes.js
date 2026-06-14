const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const protect = require("../middleware/authMiddleware");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");

router.get("/profile", protect, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Throttle: 3 test emails per 15 minutes per IP
const emailTestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many test emails requested. Try again later." },
});

// GET /api/test/email
// Sends a test email to the logged-in user's own address only.
router.get("/email", protect, emailTestLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("email");
    if (!user?.email) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const result = await sendEmail({
      to: user.email,
      subject: "ProjectFlow — Email Test ✅",
      html: `
        <h2>Email is working!</h2>
        <p>Your ProjectFlow email configuration is set up correctly.</p>
        <p>You can now send invitations.</p>
      `,
    });

    if (!result.success) {
      return res.status(502).json({
        success: false,
        message: "Email could not be sent. Check your SMTP configuration.",
      });
    }

    res.json({ success: true, message: `Test email sent to ${user.email}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;