const rateLimit = require("express-rate-limit");

const createRateLimiter = ({
  windowMs = 60 * 1000,
  limit = 120,
  message = "Too many requests from this IP, please try again later.",
  statusCode = 429,
  skipSuccessfulRequests = false,
  skipFailedRequests = false,
} = {}) => {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    statusCode,
    skipSuccessfulRequests,
    skipFailedRequests,
    message: {
      success: false,
      message,
    },
    handler: (req, res) => {
      return res.status(statusCode).json({
        success: false,
        message,
      });
    },
  });
};

const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 120,
  message: "Too many requests from this IP, please try again later.",
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});

const publicInviteLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  message: "Too many invite requests from this IP, please try again later.",
});

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  publicInviteLimiter,
};
