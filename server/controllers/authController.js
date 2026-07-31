const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// REGISTER
const registerUser = async (req,res)=>{

    try{

        const {name,email,password} = req.body;

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

        const {email,password} = req.body;

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

module.exports = {
    registerUser,
    loginUser,
    updateProfile
};
