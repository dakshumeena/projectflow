import API from "./axios";

export const getWorkspaces = async () => {
  const res = await API.get("/api/workspaces");
  return res.data;
};

export const createWorkspace = async (workspaceData) => {
  const res = await API.post("/api/workspaces", workspaceData);
  return res.data;
};

export const inviteMember = async (workspaceId, email) => {
  const res = await API.post(
    `/api/workspaces/${workspaceId}/members`,
    { email }
  );
  return res.data;
};

export const deleteWorkspace = async (workspaceId) => {
  const res = await API.delete(`/api/workspaces/${workspaceId}`);
  return res.data;
};