const Workspace = require("../models/Workspace");
const Project = require("../models/Project");
const Task=require("../models/Task")
const Invitation = require("../models/Invitation");
const createActivity = require("../utils/createActivity");
const User = require("../models/User");
const crypto = require("crypto");
const sendInviteEmail = require("../utils/sendEmail");
const createWorkspace = async (req, res) => {
  
  try {
    const { name, description } = req.body;

    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user.id,
      members: [req.user.id],
    });

    const populatedWorkspace = await Workspace.findById(workspace._id)
      .populate("owner", "name email image")
      .populate("members", "name email image");

    await createActivity({
      action: "Workspace Created",
      entityType: "WORKSPACE",
      entityId: workspace._id,
      user: req.user.id,
      workspace: workspace._id,
    });

    res.status(201).json({
      success: true,
      workspace: populatedWorkspace,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addMemberToWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email } = req.body;

    const workspace = await Workspace.findById(workspaceId).populate("owner", "name email");
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && workspace.members.includes(existingUser._id)) {
      return res.status(400).json({ success: false, message: "User already a member" });
    }

    // Replace any previous pending invite for this email+workspace
    await Invitation.deleteMany({ email, workspace: workspace._id, type: "WORKSPACE", status: "PENDING" });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await Invitation.create({
      type: "WORKSPACE",
      email,
      workspace: workspace._id,
      invitedBy: req.user.id,
      token,
      expiresAt,
    });

    const inviteLink = `${process.env.CLIENT_URL}/invite/${token}`;

    await sendInviteEmail({
  email,
  projectName: workspace.name,
  inviteLink,
  invitedByName: workspace.owner?.name,
});


    res.status(200).json({ success: true, message: "Invitation email sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Accept workspace invitation
const acceptWorkspaceInvitation = async (req, res) => {
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
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: `This invitation was sent to ${invitation.email}. Please log in with that account.`,
      });
    }

    const workspace = await Workspace.findById(invitation.workspace);
    if (!workspace) return res.status(404).json({ success: false, message: "Workspace no longer exists" });

    if (!workspace.members.map(String).includes(String(user._id))) {
      workspace.members.push(user._id);
      await workspace.save();
    }

    invitation.status = "ACCEPTED";
    await invitation.save();

    await createActivity({
      action: `${user.name} joined workspace "${workspace.name}"`,
      entityType: "WORKSPACE",
      entityId: workspace._id,
      user: user._id,
      workspace: workspace._id,
    });

    res.status(200).json({
      success: true,
      message: "You have joined the workspace successfully",
      workspace: { _id: workspace._id, name: workspace.name },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get workspace invitation details (public)
const getWorkspaceInvitationDetails = async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({ token })
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
        email: invitation.email,
        workspaceName: invitation.workspace?.name,
        invitedBy: invitation.invitedBy?.name,
        type: "WORKSPACE",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }
    if (workspace.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Only the workspace owner can delete it" });
    }
      const projects = await Project.find({
      workspace: req.params.id,
    });
     const projectIds = projects.map((project) => project._id);
      await Task.deleteMany({
      project: { $in: projectIds },
    });
     await Project.deleteMany({
      workspace: req.params.id,
    });
     await Workspace.findByIdAndDelete(req.params.id);
        res.status(200).json({
      success: true,
      message: "Workspace and all related projects/tasks deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ members: req.user.id })
      .populate("owner", "name email image")
      .populate("members", "name email image")
      .sort({ createdAt: -1 });

    const workspacesWithProjects = await Promise.all(
      workspaces.map(async (ws) => {
        const projects = await Project.find({ workspace: ws._id })
          .populate("team_lead", "name email image")
          .sort({ createdAt: -1 });

        const projectsWithTasks = await Promise.all(
          projects.map(async (proj) => {
            const Task = require("../models/Task");
            const tasks = await Task.find({ project: proj._id })
              .populate("assignee", "name email image")
              .sort({ createdAt: -1 });

            const ProjectMember = require("../models/ProjectMember");
            const members = await ProjectMember.find({ project: proj._id })
              .populate("user", "name email image");

            return { ...proj.toObject(), tasks, members };
          })
        );

        const wsObj = ws.toObject();
        wsObj.members = wsObj.members.map((m) => ({
          user: m,
          role: m._id.toString() === wsObj.owner._id.toString() ? "ADMIN" : "MEMBER",
        }));
        wsObj.projects = projectsWithTasks;
        return wsObj;
      })
    );

    res.status(200).json({ success: true, workspaces: workspacesWithProjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getMyInvitations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const invitations = await Invitation.find({
      email: user.email,
      status: "PENDING",
      expiresAt: { $gt: new Date() },
    })
      .populate("workspace", "name")
      .populate("invitedBy", "name");
const validInvitations = invitations.filter(
  (invite) => invite.workspace
);


    res.status(200).json({
      success: true,
      invitations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const declineInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
    }

    invitation.status = "EXPIRED";
    await invitation.save();

    res.json({
      success: true,
      message: "Invitation declined",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  createWorkspace,
  getWorkspaces,
  addMemberToWorkspace,
  acceptWorkspaceInvitation,
  getWorkspaceInvitationDetails,
  deleteWorkspace,
  getMyInvitations,
  declineInvitation
};