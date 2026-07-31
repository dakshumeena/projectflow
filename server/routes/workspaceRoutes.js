const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createWorkspace,
  getWorkspaces,
  addMemberToWorkspace,
  acceptWorkspaceInvitation,
  getWorkspaceInvitationDetails,
  deleteWorkspace,
  getMyInvitations,
  declineInvitation
} = require("../controllers/workspaceController");

router.post("/", protect, createWorkspace);
router.get("/my-invitations", protect, getMyInvitations);
router.post(
  "/invite/:token/decline",
  protect,
  declineInvitation
);
router.get("/", protect, getWorkspaces);
router.post("/:workspaceId/members", protect, addMemberToWorkspace);
router.delete("/:id", protect, deleteWorkspace);

// Workspace invitation routes

router.get("/invite/:token", getWorkspaceInvitationDetails);           // public
router.post("/invite/:token/accept", protect, acceptWorkspaceInvitation); // requires login

module.exports = router;