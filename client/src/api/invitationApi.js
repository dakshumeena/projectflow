import API from "./axios";

export const getInvitationDetails = async (token) => {
  const res = await API.get(`/invitations/${token}`);
  return res.data;
};

export const acceptInvitation = async (token) => {
  const res = await API.post(`/invitations/${token}/accept`);
  return res.data;
};