const ProjectMember = require("../models/ProjectMember");
const Workspace = require("../models/Workspace");

const getProjectAccess = async (project, userId) => {
  const workspace = await Workspace.findById(project.workspace).select("owner");
  if (!workspace) return null;

  const userIdString = userId.toString();
  const isAdmin = workspace.owner.toString() === userIdString;
  const isLead = project.team_lead?.toString() === userIdString;
  const isMember = await ProjectMember.exists({ project: project._id, user: userId });

  return { isAdmin, isLead, isMember: Boolean(isMember) };
};

const canManageProject = (access) => access && (access.isAdmin || access.isLead);

module.exports = { getProjectAccess, canManageProject };