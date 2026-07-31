const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["WORKSPACE", "PROJECT"], required: true, default: "PROJECT" },
    email: { type: String, required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" }, // only set for PROJECT invites
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: ["PENDING", "ACCEPTED", "EXPIRED"], default: "PENDING" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invitation", invitationSchema);