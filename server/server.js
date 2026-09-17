const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const { apiLimiter } = require("./middleware/rateLimiter");

// Register all models FIRST so populate() works across files
require("./models/User");
require("./models/Workspace");
require("./models/Project");
require("./models/ProjectMember");
require("./models/Task");
require("./models/Comment");
require("./models/Activity");
require("./models/Invitation");

const authRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const activityRoutes = require("./routes/activityRoutes");
const invitationRoutes = require("./routes/invitationRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/invitations", invitationRoutes);

app.get("/", (req, res) => res.send("API Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));