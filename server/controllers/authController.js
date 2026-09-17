const User = require("../models/User");
const Workspace = require("../models/Workspace");
const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const Task = require("../models/Task");
const Comment = require("../models/Comment");
const Activity = require("../models/Activity");
const Invitation = require("../models/Invitation");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// REGISTER
const registerUser = async (req,res)=>{

    try{

        const name = req.body.name?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password;

        if (!name || !email || !password) {
            return res.status(400).json({
                success:false,
                message:"Name, email, and password are required"
            });
        }

        const userExists = await User.findOne({email});

        if(userExists){
            return res.status(400).json({
                success:false,
                message:"User already exists"
            });
        }

        const salt = await bcrypt.genSalt(10);

        const hashedPassword =await bcrypt.hash(password,salt);
        
            

        const user = await User.create({
            name,
            email,
            password:hashedPassword
        });

        const token = jwt.sign(
            {id:user._id},
            process.env.JWT_SECRET,
            {expiresIn:"7d"}
        );

        res.status(201).json({
            success:true,
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email
            }
        });

    }
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
};



// LOGIN
const loginUser = async(req,res)=>{

    try{

        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password;

        if (!email || !password) {
            return res.status(400).json({
                success:false,
                message:"Email and password are required"
            });
        }

        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({
                success:false,
                message:"Invalid credentials"
            });
        }

        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if(!isMatch){
            return res.status(400).json({
                success:false,
                message:"Invalid credentials"
            });
        }

        const token = jwt.sign(
            {id:user._id},
            process.env.JWT_SECRET,
            {expiresIn:"7d"}
        );

        res.status(200).json({
            success:true,
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email
            }
        });

    }
    catch(error){

        res.status(500).json({
            success:false,
            message:error.message
        });

    }
};

// UPDATE PROFILE
const updateProfile = async (req, res) => {
    try {
        const name = req.body.name?.trim();

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Name cannot be empty"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name },
            {
                new: true,
                runValidators: true
            }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current and new passwords are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters"
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ success: false, message: "Current password is incorrect" });
        }

        user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
        await user.save();

        return res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("email");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const ownedWorkspaces = await Workspace.find({ owner: user._id }).select("_id");
        const workspaceIds = ownedWorkspaces.map((workspace) => workspace._id);
        const ownedProjects = workspaceIds.length
            ? await Project.find({ workspace: { $in: workspaceIds } }).select("_id")
            : [];
        const projectIds = ownedProjects.map((project) => project._id);

        if (projectIds.length) {
            const ownedTaskIds = await Task.find({ project: { $in: projectIds } }).distinct("_id");
            await Comment.deleteMany({ task: { $in: ownedTaskIds } });
            await Task.deleteMany({ project: { $in: projectIds } });
            await ProjectMember.deleteMany({ project: { $in: projectIds } });
        }

        if (workspaceIds.length) {
            await Invitation.deleteMany({ workspace: { $in: workspaceIds } });
            await Activity.deleteMany({ workspace: { $in: workspaceIds } });
            await Project.deleteMany({ workspace: { $in: workspaceIds } });
            await Workspace.deleteMany({ _id: { $in: workspaceIds } });
        }

        await Workspace.updateMany(
            { members: user._id },
            { $pull: { members: user._id, joinRequests: { user: user._id } } }
        );
        await ProjectMember.deleteMany({ user: user._id });
        const createdTaskIds = await Task.find({ createdBy: user._id }).distinct("_id");
        await Comment.deleteMany({ task: { $in: createdTaskIds } });
        await Task.deleteMany({ createdBy: user._id });
        await Task.updateMany({ assignee: user._id }, { $set: { assignee: null } });
        await Comment.deleteMany({ user: user._id });
        await Activity.deleteMany({ user: user._id });
        await Invitation.deleteMany({ $or: [{ invitedBy: user._id }, { email: user.email }] });
        await User.findByIdAndDelete(user._id);

        return res.status(200).json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getNotificationPreferences = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("notificationPreferences");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            preferences: user.notificationPreferences,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateNotificationPreferences = async (req, res) => {
    try {
        const allowedKeys = ["taskAssigned", "projectUpdated", "memberJoined", "weeklyDigest"];
        const preferences = {};

        allowedKeys.forEach((key) => {
            if (typeof req.body[key] === "boolean") preferences[key] = req.body[key];
        });

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: Object.fromEntries(Object.entries(preferences).map(([key, value]) => [`notificationPreferences.${key}`, value])) },
            { new: true, runValidators: true }
        ).select("notificationPreferences");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            preferences: user.notificationPreferences,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    updateProfile,
    changePassword,
    deleteAccount,
    getNotificationPreferences,
    updateNotificationPreferences
};
