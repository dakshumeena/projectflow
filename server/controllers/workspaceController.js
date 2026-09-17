const Workspace = require("../models/Workspace");
const Project = require("../models/Project");
const Task=require("../models/Task")
const Invitation = require("../models/Invitation");
const createActivity = require("../utils/createActivity");
const User = require("../models/User");
const crypto = require("crypto");
const sendInviteEmail = require("../utils/sendEmail");

const generateJoinCode = () => crypto.randomBytes(4).toString("hex").toUpperCase();
const isWorkspaceOwner = (workspace, userId) => workspace.owner.toString() === userId.toString();

const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;
    let joinCode;
    do {
      joinCode = generateJoinCode();
    } while (await Workspace.exists({ joinCode }));

    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user.id,
      members: [req.user.id],
      joinCode,
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
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: "Email address is required" });
    }

    const workspace = await Workspace.findById(workspaceId).populate("owner", "name email");
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "Only registered users can be invited" });
    }
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

const requestToJoinWorkspace = async (req, res) => {
  try {
    const code = String(req.body.code || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ success: false, message: "Enter a workspace code" });

    const workspace = await Workspace.findOne({ joinCode: code });
    if (!workspace) return res.status(404).json({ success: false, message: "Workspace code not found" });
    if (workspace.members.some((memberId) => memberId.toString() === req.user.id.toString())) {
      return res.status(400).json({ success: false, message: "You are already a member of this workspace" });
    }
    if (workspace.joinRequests.some((request) => request.user.toString() === req.user.id.toString() && request.status === "PENDING")) {
      return res.status(400).json({ success: false, message: "Your join request is already pending" });
    }

    workspace.joinRequests.push({ user: req.user.id });
    await workspace.save();
    res.status(201).json({ success: true, message: `Join request sent to the owner of ${workspace.name}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getWorkspaceJoinRequests = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId).populate("joinRequests.user", "name email image");
    if (!workspace) return res.status(404).json({ success: false, message: "Workspace not found" });
    if (!isWorkspaceOwner(workspace, req.user.id)) {
      return res.status(403).json({ success: false, message: "Only the workspace owner can manage join requests" });
    }
    res.json({
      success: true,
      requests: workspace.joinRequests.filter((request) => request.status === "PENDING").sort((a, b) => b.createdAt - a.createdAt),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const reviewWorkspaceJoinRequest = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid request status" });
    }
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) return res.status(404).json({ success: false, message: "Workspace not found" });
    if (!isWorkspaceOwner(workspace, req.user.id)) {
      return res.status(403).json({ success: false, message: "Only the workspace owner can review join requests" });
    }

    const request = workspace.joinRequests.id(req.params.requestId);
    if (!request || !["PENDING", "ACCEPTED"].includes(request.status)) {
      return res.status(404).json({ success: false, message: "Pending join request not found" });
    }
    // ACCEPTED was never a valid join-request status, but normalize legacy records
    // so an old manually edited request can be repaired through this endpoint.
    request.status = status === "APPROVED" ? "APPROVED" : "REJECTED";
    request.reviewedAt = new Date();
    if (status === "APPROVED" && !workspace.members.some((memberId) => memberId.toString() === request.user.toString())) {
      workspace.members.push(request.user);
    }
    await workspace.save();
    await createActivity({
      action: status === "APPROVED" ? "Member joined workspace" : "Workspace join request rejected",
      entityType: "WORKSPACE",
      entityId: workspace._id,
      user: request.user,
      workspace: workspace._id,
    });
    res.json({ success: true, message: status === "APPROVED" ? "Member approved" : "Join request rejected" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyJoinRequests = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ "joinRequests.user": req.user.id }).select("name joinRequests");
    const requests = workspaces.flatMap((workspace) => workspace.joinRequests
      .filter((request) => request.user.toString() === req.user.id.toString() && request.status !== "PENDING")
      .map((request) => ({
        _id: request._id,
        status: request.status === "ACCEPTED" ? "APPROVED" : request.status,
        createdAt: request.createdAt,
        reviewedAt: request.reviewedAt,
        workspace: { _id: workspace._id, name: workspace.name },
      })));
    const latestRequestsByWorkspace = new Map();
    requests.forEach((request) => {
      const workspaceId = request.workspace._id.toString();
      const current = latestRequestsByWorkspace.get(workspaceId);
      if (!current || new Date(request.createdAt) > new Date(current.createdAt)) {
        latestRequestsByWorkspace.set(workspaceId, request);
      }
    });
    res.json({ success: true, requests: [...latestRequestsByWorkspace.values()] });
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
        if (!ws.joinCode) {
          do {
            ws.joinCode = generateJoinCode();
          } while (await Workspace.exists({ joinCode: ws.joinCode, _id: { $ne: ws._id } }));
          await ws.save();
        }
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
  declineInvitation,
  requestToJoinWorkspace,
  getWorkspaceJoinRequests,
  reviewWorkspaceJoinRequest,
  getMyJoinRequests,
};