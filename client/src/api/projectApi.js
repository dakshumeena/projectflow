import API from "./axios";

export const createProject = async (projectData) => {
  const res = await API.post("/projects", projectData);
  return res.data;
};

export const getProjectsByWorkspace = async (workspaceId) => {
  const res = await API.get(`/projects/workspace/${workspaceId}`);
  return res.data;
};

export const getProjectById = async (projectId) => {
  const res = await API.get(`/projects/${projectId}`);
  return res.data;
};

export const updateProject = async (projectId, projectData) => {
  const res = await API.put(`/projects/${projectId}`, projectData);
  return res.data;
};

export const deleteProject = async (projectId) => {
  const res = await API.delete(`/projects/${projectId}`);
  return res.data;
};