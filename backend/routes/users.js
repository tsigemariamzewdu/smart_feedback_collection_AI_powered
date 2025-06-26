const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET /api/user?role=chef OR ?role=customer
router.get("/", async (req, res) => {
  try {
    const { role } = req.query;

    if (!role) {
      return res.status(400).json({ message: "Role query parameter is required" });
    }

    const users = await User.find({ role });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
});

module.exports = router;
