const React = require("react");
const {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Preview,
} = require("@react-email/components");

const ProjectInviteEmail = ({ projectName, inviteLink, invitedByName }) => {
  return React.createElement(
    Html,
    null,
    React.createElement(Head),
    React.createElement(
      Preview,
      null,
      `You've been invited to join ${projectName} on ProjectFlow`
    ),
    React.createElement(
      Body,
      { style: main },
      React.createElement(
        Container,
        { style: container },
        React.createElement(Heading, { style: heading }, "Project Invitation"),
        React.createElement(
          Text,
          { style: text },
          invitedByName ? `${invitedByName} has invited you` : "You've been invited",
          " to join the project ",
          React.createElement("strong", null, projectName),
          " on ProjectFlow."
        ),
        React.createElement(Button, { href: inviteLink, style: button }, "Join Project"),
        React.createElement(
          Text,
          { style: footer },
          "This link expires in 7 days. If you don't have an account, you'll be asked to register first."
        )
      )
    )
  );
};

const main = { backgroundColor: "#f4f4f5", fontFamily: "Arial, sans-serif", padding: "40px 0" };
const container = { backgroundColor: "#ffffff", margin: "0 auto", padding: "32px", borderRadius: "8px", maxWidth: "480px" };
const heading = { fontSize: "20px", color: "#18181b" };
const text = { fontSize: "14px", color: "#3f3f46", lineHeight: "22px" };
const button = { backgroundColor: "#3b82f6", color: "#fff", padding: "12px 24px", borderRadius: "6px", textDecoration: "none", display: "inline-block", marginTop: "16px" };
const footer = { fontSize: "12px", color: "#a1a1aa", marginTop: "24px" };

module.exports = ProjectInviteEmail;