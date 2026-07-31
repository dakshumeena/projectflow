const ProjectInviteEmail = require("../email/ProjectInviteEmail");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendInviteEmail = async ({
  email,
  projectName,
  inviteLink,
  invitedByName,
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Invitation to join ${projectName}`,
      react: ProjectInviteEmail({
        projectName,
        inviteLink,
        invitedByName,
      }),
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
module.exports = sendInviteEmail;