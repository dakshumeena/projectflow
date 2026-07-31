import API from "./axios";

export const createTask = async (taskData) => {
  const res = await API.post("/tasks", taskData);
  return res.data;
};

export const getTasksByProject = async (projectId) => {
  const res = await API.get(`/tasks/project/${projectId}`);
  return res.data;
};

export const getTaskById = async (taskId) => {
  const res = await API.get(`/tasks/${taskId}`);
  return res.data;
};

export const updateTask = async (taskId, taskData) => {
  const res = await API.put(`/tasks/${taskId}`, taskData);
  return res.data;
};

export const deleteTask = async (taskId) => {
  const res = await API.delete(`/tasks/${taskId}`);
  return res.data;
};

export const getTaskStats = async (projectId) => {
  const res = await API.get(`/tasks/stats/${projectId}`);
  return res.data;
};

export const getTaskComments = async (taskId) => {
  const res = await API.get(`/tasks/${taskId}/comments`);
  return res.data;
};

export const addComment = async (taskId, content) => {
  const res = await API.post(`/tasks/${taskId}/comments`, { content });
  return res.data;
};