const mongoose = require("mongoose");

const joinRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    joinCode: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    joinRequests: [joinRequestSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workspace", workspaceSchema);