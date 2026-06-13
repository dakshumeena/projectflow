require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const connectDB = require("./config/db");

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
const testRoutes = require("./routes/testRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const activityRoutes = require("./routes/activityRoutes");
const testEmailRoute = require("./routes/Testemailroute");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/test", testEmailRoute);   // GET /api/test/email?to=...
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/activities", activityRoutes);

app.get("/", (req, res) => res.send("API Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));