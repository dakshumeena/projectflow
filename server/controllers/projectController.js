const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const User = require("../models/User");
const Invitation = require("../models/Invitation");
const createActivity = require("../utils/createActivity");
const crypto = require("crypto");
const Task = require("../models/Task");

const createProject = async (req, res) => {
  try {
    const {
      name, description, workspace, status,
      priority, start_date, end_date, team_lead, team_members,
    } = req.body;

    const project = await Project.create({
      name, description, workspace, status, priority,
      start_date, end_date,
      team_lead: team_lead || req.user.id,
    });

    const memberSet = new Set([req.user.id]);
    if (team_lead) memberSet.add(team_lead);
    if (Array.isArray(team_members)) team_members.forEach((e) => memberSet.add(e));

    const resolvedIds = await Promise.all(
      [...memberSet].map(async (idOrEmail) => {
        if (idOrEmail.includes("@")) {
          const u = await User.findOne({ email: idOrEmail });
          return u ? u._id.toString() : null;
        }
        return idOrEmail;
      })
    );

    const uniqueIds = [...new Set(resolvedIds.filter(Boolean))];
    await ProjectMember.insertMany(
      uniqueIds.map((uid) => ({ user: uid, project: project._id })),
      { ordered: false }
    ).catch(() => {});

    await createActivity({
      action: "Project Created",
      entityType: "PROJECT",
      entityId: project._id,
      user: req.user.id,
      workspace: project.workspace,
    });

    const populated = await Project.findById(project._id)
      .populate("team_lead", "name email image");

    res.status(201).json({ success: true, project: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProjectsByWorkspace = async (req, res) => {
  try {
    const projects = await Project.find({ workspace: req.params.workspaceId })
      .populate("team_lead", "name email image")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("team_lead", "name email image");

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const members = await ProjectMember.find({ project: project._id })
      .populate("user", "name email image");

    res.status(200).json({ success: true, project: { ...project.toObject(), members } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("team_lead", "name email image");

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    await createActivity({
      action: "Project Updated",
      entityType: "PROJECT",
      entityId: project._id,
      user: req.user.id,
      workspace: project.workspace,
    });

    res.status(200).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    await createActivity({
      action: "Project Deleted",
      entityType: "PROJECT",
      entityId: project._id,
      user: req.user.id,
      workspace: project.workspace,
    });
    await Task.deleteMany({ project: project._id });
    await ProjectMember.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Project and related tasks deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addMemberToProject = async (req, res) => {
  try {
    const { email } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      const existingMember = await ProjectMember.findOne({ user: existingUser._id, project: project._id });
      if (existingMember) {
        return res.status(400).json({ success: false, message: "User already a project member" });
      }
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Invitation.deleteMany({ email, project: project._id, status: "PENDING" });

    const invitation = await Invitation.create({
      type: "PROJECT",
      email,
      project: project._id,
      workspace: project.workspace,
      invitedBy: req.user.id,
      token,
      expiresAt,
    });

    const inviteLink = `${process.env.CLIENT_URL}/invite/${token}`;

    const inviter = await User.findById(req.user.id).select("name");

    const emailResult = await sendInviteEmail({
      to: email,
      projectName: project.name,
      inviteLink,
      invitedByName: inviter?.name,
    });

    if (!emailResult.success) {
      return res.status(200).json({
        success: true,
        message: "Invitation created, but the email could not be sent. Share this link manually.",
        inviteLink,
      });
    }

    res.status(200).json({ success: true, message: "Invitation email sent successfully" });

    if (!emailResult.success) {
      return res.status(200).json({
        success: true,
        message: "Invitation created, but the email could not be sent. Share this link manually.",
        inviteLink,
      });
    }

    res.status(200).json({ success: true, message: "Invitation email sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProject,
  getProjectsByWorkspace,
  getProjectById,
  updateProject,
  deleteProject,
  addMemberToProject,
};