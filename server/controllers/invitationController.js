const Invitation = require("../models/Invitation");
const Project = require("../models/Project");
const Workspace = require("../models/Workspace");
const ProjectMember = require("../models/ProjectMember");
const User = require("../models/User");
const createActivity = require("../utils/createActivity");

// GET /api/invitations/:token (public — shown before login)
const getInvitationDetails = async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({ token })
      .populate("project", "name")
      .populate("workspace", "name")
      .populate("invitedBy", "name");

    if (!invitation) {
      return res.status(404).json({ success: false, message: "Invalid or expired invitation" });
    }

    if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "This invitation is no longer valid" });
    }

    res.status(200).json({
      success: true,
      invitation: {
        type: invitation.type,
        email: invitation.email,
        projectName: invitation.project?.name,
        workspaceName: invitation.workspace?.name,
        invitedBy: invitation.invitedBy?.name,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/invitations/:token/accept (requires login)
const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token });
    if (!invitation) {
      return res.status(404).json({ success: false, message: "Invalid or expired invitation" });
    }

    if (invitation.status === "ACCEPTED") {
      return res.status(400).json({ success: false, message: "Invitation already used" });
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = "EXPIRED";
      await invitation.save();
      return res.status(400).json({ success: false, message: "Invitation has expired" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: `This invitation was sent to ${invitation.email}. Please log in with that account.`,
      });
    }

    const workspace = await Workspace.findById(invitation.workspace);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace no longer exists" });
    }

    // Step 9 from your diagram: create the access record
    if (!workspace.members.includes(user._id)) {
      workspace.members.push(user._id);
      await workspace.save();
    }

    let project = null;

    if (invitation.type === "PROJECT") {
      project = await Project.findById(invitation.project);
      if (!project) {
        return res.status(404).json({ success: false, message: "Project no longer exists" });
      }

      const existingMember = await ProjectMember.findOne({ user: user._id, project: project._id });
      if (!existingMember) {
        await ProjectMember.create({ user: user._id, project: project._id });
      }
    }

    // Step 8: mark the token as used (instead of deleting, we keep history)
    invitation.status = "ACCEPTED";
    await invitation.save();

    await createActivity({
      action:
        invitation.type === "PROJECT"
          ? `${user.name} joined project "${project.name}"`
          : `${user.name} joined workspace "${workspace.name}"`,
      entityType: invitation.type,
      entityId: invitation.type === "PROJECT" ? project._id : workspace._id,
      user: user._id,
      workspace: workspace._id,
    });

    res.status(200).json({
      success: true,
      message:
        invitation.type === "PROJECT"
          ? "You have joined the project successfully"
          : "You have joined the workspace successfully",
      type: invitation.type,
      workspace: { _id: workspace._id, name: workspace.name },
      project: project ? { _id: project._id, name: project.name } : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getInvitationDetails, acceptInvitation };