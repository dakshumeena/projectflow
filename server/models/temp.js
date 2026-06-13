const mongoose = require("mongoose");

const projectMemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
});

projectMemberSchema.index({ user: 1, project: 1 }, { unique: true });

module.exports = mongoose.model("ProjectMember", projectMemberSchema);