import API from "./axios";

export const createProject = async (projectData) => {
  const res = await API.post("/api/projects", projectData);
  return res.data;
};

export const getProjectsByWorkspace = async (workspaceId) => {
  const res = await API.get(`/api/projects/workspace/${workspaceId}`);
  return res.data;
};

export const getProjectById = async (projectId) => {
  const res = await API.get(`/api/projects/${projectId}`);
  return res.data;
};

export const updateProject = async (projectId, projectData) => {
  const res = await API.put(`/api/projects/${projectId}`, projectData);
  return res.data;
};

export const deleteProject = async (projectId) => {
  const res = await API.delete(`/api/projects/${projectId}`);
  return res.data;
};

export const getInvitationDetails = async (token) => {
  const res = await API.get(`/api/projects/invite/${token}`);
  return res.data;
};

export const acceptInvitation = async (token) => {
  const res = await API.post(`/api/projects/invite/${token}/accept`);
  return res.data;
};