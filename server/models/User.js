const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    name:{
        type:String,
        required:true
    },

    email:{
        type:String,
        required:true,
        unique:true
    },

    password:{
        type:String,
        required:true
    },

    notificationPreferences: {
        taskAssigned: { type: Boolean, default: true },
        projectUpdated: { type: Boolean, default: true },
        memberJoined: { type: Boolean, default: false },
        weeklyDigest: { type: Boolean, default: false }
    }
},
{
    timestamps:true
}
);

module.exports = mongoose.model("User", userSchema);