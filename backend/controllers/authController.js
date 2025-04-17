const bcrypt = require("bcrypt");
const User = require("../models/User");
const generateToken = require("../lib/utils");


 
const signup = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      role,
    } = req.body;

    // Validate required fields
    if (
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      !gender ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required",
      });
    }

    // Check if user with same email and role already exists
    const existingUser = await User.findOne({ email, role });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        msg: "User already exists with this email and role",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      role,
    });

    await newUser.save();

    // Generate token
    generateToken(newUser._id, newUser.hospitalId, newUser.role, res);

    // Return success response
    res.status(201).json({
      success: true,
      userId: newUser._id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      gender: newUser.gender,
      role: newUser.role,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error. Please try again later.",
    });
  }
};

 

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
 
    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        msg: "Please provide email, password, and role",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found. Please check your email or register.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        msg: "Invalid password. Please try again.",
      });
    }

    if (user.role !== role) {
      return res.status(403).json({
        success: false,
        msg: `Access denied. This account is not registered as a ${role}.`,
      });
    }

    generateToken(user._id, user.hospitalId, user.role, res);

    res.status(200).json({
      success: true,
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      role: user.role,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error. Please try again later.",
    });
  }
};


// authenticate
const jwt = require("jsonwebtoken");

const auth = (req, res) => {
  const token = req.cookies.jwt;
   if (!token) return res.status(401).json({ msg: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
     res.status(200).json(
      decoded
    );
     
  } catch (err) {
    res.status(401).json({ msg: "Invalid token" });
  }
};


module.exports = { login,signup,auth };
