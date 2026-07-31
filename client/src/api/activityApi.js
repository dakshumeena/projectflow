import API from "./axios";

export const getWorkspaceActivities = async (workspaceId) => {
  const res = await API.get(`/activities/workspace/${workspaceId}`);
  return res.data;
};