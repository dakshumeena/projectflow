const Task = require("../models/Task");
const Project = require("../models/Project");
const Comment = require("../models/Comment");
const updateProjectProgress = require("../utils/updateProjectProgress");
const createActivity = require("../utils/createActivity");
const User = require("../models/User");
const { getProjectAccess, canManageProject } = require("../utils/projectPermissions");

const createTask = async (req, res) => {
  try {
    const { title, description, status, type, priority, due_date, projectId, assigneeId } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    const access = await getProjectAccess(project, req.user.id);
    if (!canManageProject(access)) {
      return res.status(403).json({ success: false, message: "Only the project admin or lead can manage tasks" });
    }

    // Resolve assigneeId (could be a userId string)
    let assignee = null;
    if (assigneeId) {
      const user = await User.findById(assigneeId);
      if (user) assignee = user._id;
    }

    const task = await Task.create({
      title,
      description,
      status: status || "TODO",
      type: type || "TASK",
      priority: priority || "MEDIUM",
      due_date,
      project: projectId,
      assignee,
      createdBy: req.user.id,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("assignee", "name email image")
      .populate("createdBy", "name email image");

    await createActivity({
      action: `Task "${title}" created`,
      entityType: "TASK",
      entityId: task._id,
      user: req.user.id,
      workspace: project.workspace,
    });

    await updateProjectProgress(projectId);

    res.status(201).json({ success: true, task: populatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate("assignee", "name email image")
      .populate("createdBy", "name email image")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignee", "name email image")
      .populate("createdBy", "name email image");

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("assignee", "name email image")
      .populate("createdBy", "name email image");

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const project = await Project.findById(task.project);
    const access = await getProjectAccess(project, req.user.id);
    if (!canManageProject(access)) {
      return res.status(403).json({ success: false, message: "Only the project admin or lead can manage tasks" });
    }

    await createActivity({
      action: `Task "${task.title}" updated`,
      entityType: "TASK",
      entityId: task._id,
      user: req.user.id,
      workspace: project.workspace,
    });

    await updateProjectProgress(task.project);

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const project = await Project.findById(task.project);
    const projectId = task.project;
    const access = await getProjectAccess(project, req.user.id);
    if (!canManageProject(access)) {
      return res.status(403).json({ success: false, message: "Only the project admin or lead can manage tasks" });
    }

    await createActivity({
      action: `Task "${task.title}" deleted`,
      entityType: "TASK",
      entityId: task._id,
      user: req.user.id,
      workspace: project.workspace,
    });

    await Comment.deleteMany({ task: task._id });
    await Task.findByIdAndDelete(req.params.id);
    await updateProjectProgress(projectId);

    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTaskStats = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const total = await Task.countDocuments({ project: projectId });
    const todo = await Task.countDocuments({ project: projectId, status: "TODO" });
    const inProgress = await Task.countDocuments({ project: projectId, status: "IN_PROGRESS" });
    const completed = await Task.countDocuments({ project: projectId, status: "DONE" });

    res.status(200).json({ success: true, total, todo, inProgress, completed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tasks/:taskId/comments
const getTaskComments = async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate("user", "name email image")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tasks/:taskId/comments
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: "Comment content required" });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const comment = await Comment.create({
      content,
      user: req.user.id,
      task: task._id,
    });

    const populated = await Comment.findById(comment._id)
      .populate("user", "name email image");

    res.status(201).json({ success: true, comment: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskStats,
  getTaskComments,
  addComment,
};