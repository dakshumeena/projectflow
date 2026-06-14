const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    await getTransporter().sendMail({
      from: `"ProjectFlow" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent to:", to);
    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;