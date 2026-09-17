const ProjectInviteEmail = require("../email/ProjectInviteEmail");
const { render } = require("@react-email/render");
const nodemailer = require("nodemailer");

if (!process.env.SMTP_HOST) {
  throw new Error("SMTP_HOST must be configured before sending email");
}

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== "false",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendInviteEmail = async ({
  email,
  projectName,
  inviteLink,
  invitedByName,
}) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("SMTP_USER and SMTP_PASS must be configured to send email");
    }

    const html = await render(ProjectInviteEmail({
      projectName,
      inviteLink,
      invitedByName,
    }));

    return await mailer.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: `Invitation to join ${projectName}`,
      html,
    });
  } catch (err) {
    console.error(err);
    if (err?.responseCode === 535 || err?.code === "EAUTH") {
      throw new Error(
        "SMTP authentication failed. Use your provider login email and SMTP key/password, not an API key. For Brevo, create the key under SMTP & API > SMTP, then update SMTP_USER and SMTP_PASS."
      );
    }
    throw err;
  }
};
module.exports = sendInviteEmail;