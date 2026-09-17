const express = require("express");
const { authLimiter } = require("../middleware/rateLimiter");
const {
    registerUser,
    loginUser,
    updateProfile,
    changePassword,
    deleteAccount,
    getNotificationPreferences,
    updateNotificationPreferences
} = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.patch("/profile", protect, updateProfile);
router.patch("/change-password", protect, changePassword);
router.delete("/account", protect, deleteAccount);
router.get("/notification-preferences", protect, getNotificationPreferences);
router.patch("/notification-preferences", protect, updateNotificationPreferences);

module.exports = router;
