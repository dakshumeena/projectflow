import API from "./axios";

export const getWorkspaceActivities = async (workspaceId) => {
  const res = await API.get(`/api/activities/workspace/${workspaceId}`);
  return res.data;
};