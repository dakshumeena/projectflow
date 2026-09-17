const mongoose = require("mongoose");
const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const User = require("../models/User");
const Invitation = require("../models/Invitation");
const createActivity = require("../utils/createActivity");
const crypto = require("crypto");
const Task = require("../models/Task");
const Workspace = require("../models/Workspace");
const { getProjectAccess, canManageProject } = require("../utils/projectPermissions");
const sendInviteEmail = require("../utils/sendEmail");

const createProject = async (req, res) => {
  try {
    const {
      name, description, workspace, status,
      priority, start_date, end_date, team_lead, team_members,
    } = req.body;

    const workspaceRecord = await Workspace.findById(workspace).select("owner");
    if (!workspaceRecord) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }
    if (workspaceRecord.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: "Only the workspace admin can create projects" });
    }

    const memberValues = [req.user.id, team_lead, ...(Array.isArray(team_members) ? team_members : [])]
      .filter(Boolean);
    const resolvedIds = await Promise.all(
      memberValues.map(async (idOrEmail) => {
        if (typeof idOrEmail === "string" && idOrEmail.includes("@")) {
          const user = await User.findOne({ email: idOrEmail });
          return user?._id?.toString();
        }
        return idOrEmail;
      })
    );
    const uniqueIds = [...new Set(resolvedIds.filter(Boolean).map(String))];
    const leadId = team_lead
      ? resolvedIds[memberValues.indexOf(team_lead)]
      : req.user.id;

    if (!uniqueIds.includes(String(req.user.id))) {
      return res.status(400).json({ success: false, message: "Invalid project members" });
    }
    if (!leadId || !mongoose.Types.ObjectId.isValid(leadId)) {
      return res.status(400).json({ success: false, message: "Invalid project lead" });
    }

    const project = await Project.create({
      name, description, workspace, status, priority,
      start_date, end_date,
      team_lead: leadId,
    });

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
    const existingProject = await Project.findById(req.params.id);
    if (!existingProject) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const access = await getProjectAccess(existingProject, req.user.id);
    if (!access?.isMember) {
      return res.status(403).json({ success: false, message: "You are not a member of this project" });
    }

    const requestedFields = Object.keys(req.body);
    if (!canManageProject(access) && requestedFields.some((field) => !["status", "progress"].includes(field))) {
      return res.status(403).json({
        success: false,
        message: "Only the project admin or lead can edit project details",
      });
    }

    const allowedFields = canManageProject(access)
      ? ["name", "description", "status", "priority", "start_date", "end_date", "progress", "team_lead"]
      : ["status", "progress"];
    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) existingProject[field] = req.body[field];
    });
    const project = await existingProject.save();
    await project.populate("team_lead", "name email image");

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

    const access = await getProjectAccess(project, req.user.id);
    if (!access?.isAdmin) {
      return res.status(403).json({ success: false, message: "Only the workspace admin can delete this project" });
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
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: "Email address is required" });
    }
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const access = await getProjectAccess(project, req.user.id);
    if (!canManageProject(access)) {
      return res.status(403).json({ success: false, message: "Only the project admin or lead can manage members" });
    }

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(404).json({ success: false, message: "Only registered users can be invited" });
    }

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

    await sendInviteEmail({
      email,
      projectName: project.name,
      inviteLink,
      invitedByName: inviter?.name,
    });

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