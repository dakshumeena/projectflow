const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { publicInviteLimiter } = require("../middleware/rateLimiter");
const {
  createWorkspace,
  getWorkspaces,
  addMemberToWorkspace,
  acceptWorkspaceInvitation,
  getWorkspaceInvitationDetails,
  deleteWorkspace,
  getMyInvitations,
  declineInvitation,
  requestToJoinWorkspace,
  getWorkspaceJoinRequests,
  reviewWorkspaceJoinRequest,
  getMyJoinRequests,
} = require("../controllers/workspaceController");

router.post("/", protect, createWorkspace);
router.get("/my-invitations", protect, getMyInvitations);
router.get("/my-join-requests", protect, getMyJoinRequests);
router.post("/join-requests", protect, requestToJoinWorkspace);
router.post(
  "/invite/:token/decline",
  protect,
  declineInvitation
);
router.get("/", protect, getWorkspaces);
router.post("/:workspaceId/members", protect, addMemberToWorkspace);
router.get("/:workspaceId/join-requests", protect, getWorkspaceJoinRequests);
router.patch("/:workspaceId/join-requests/:requestId", protect, reviewWorkspaceJoinRequest);
router.delete("/:id", protect, deleteWorkspace);

// Workspace invitation routes

router.get("/invite/:token", publicInviteLimiter, getWorkspaceInvitationDetails);           // public
router.post("/invite/:token/accept", protect, acceptWorkspaceInvitation); // requires login

module.exports = router;