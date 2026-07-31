const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createProject,
  getProjectsByWorkspace,
  getProjectById,
  updateProject,
  deleteProject,
  addMemberToProject,
} = require("../controllers/projectController");

router.post("/", protect, createProject);
router.get("/workspace/:workspaceId", protect, getProjectsByWorkspace);
router.get("/:id", protect, getProjectById);
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);
router.post("/:id/members", protect, addMemberToProject);

module.exports = router;