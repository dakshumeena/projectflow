import API from "./axios";

export const getWorkspaces = async () => {
  const res = await API.get("/workspaces");
  return res.data;
};

export const createWorkspace = async (workspaceData) => {
  console.log("hello from workspaceApi");
  const res = await API.post("/workspaces", workspaceData);
  return res.data;
};

export const inviteMember = async (workspaceId, email) => {
  const res = await API.post(
    `/workspaces/${workspaceId}/members`,
    { email }
  );
  return res.data;
};

export const deleteWorkspace = async (workspaceId) => {
  const res = await API.delete(`/workspaces/${workspaceId}`);
  return res.data;
};