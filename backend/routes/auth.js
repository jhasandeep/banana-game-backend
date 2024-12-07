const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Registration route
router.post("/register", async (req, res) => {
  const { username, password, role } = req.body;

  // Check for missing details
  if (!username || !password || !role) {
    return res.status(400).send("All fields are required");
  }

  try {
    // Check if user already exists
    const isUser = await User.findOne({ username });

    if (!isUser) {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user
      const user = new User({ username, password: hashedPassword, role });
      await user.save();

      return res.status(201).send("User registered successfully");
    }

    return res.status(400).send("Username already exists");
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).send("Username must be unique");
    }
    return res.status(500).send("Server error", error);
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Check if username or password is missing
  if (!username || !password) {
    return res.status(400).send("Username and password are required");
  }

  try {
    // Find user by username
    const user = await User.findOne({ username });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).send("Invalid credentials");
    }

    if (user.isBlocked) {
      return res.status(403).send("User is blocked");
    }

    console.log(process.env.JWT_SECRET, "check secret");
    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET
    );
    return res.send({ token });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server error", error);
  }
});

module.exports = router;
