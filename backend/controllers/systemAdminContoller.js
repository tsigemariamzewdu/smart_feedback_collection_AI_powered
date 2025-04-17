const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Pharmacist = require("../models/Pharmacist.js");
const LabTechnician = require("../models/LabTechnician.js");
const triage = require("../models/Triage.js");
const doctor = require("../models/Doctor.js");
const Patient = require("../models/Patient.js");
const HospitalAdministrator = require("../models/HospitalAdministrator.js");
const Hospital = require("../models/Hospital.js");
const User = require("../models/User.js");

const registerHospital = async (req, res) => {
  try {
    const { role } = req.user;
    if (role != "Admin") {
      return res.status(404).json({
        msg: "only admins can add a hospital",
      });
    }

    const hospitalData = req.body;

    const existingHospital = await Hospital.findOne({
      licenseNumber: hospitalData.licenseNumber,
    });
    if (existingHospital) {
      throw new Error("Hospital with this license number already exists");
    }

    const hospital = new Hospital({
      name: hospitalData.name,
      location: hospitalData.location,
      contactNumber: hospitalData.contactNumber,
      licenseImage: hospitalData.licenseImage,
      licenseNumber: hospitalData.licenseNumber,
    });

    const savedHospital = await hospital.save();
    res.status(201).json({ hospital });
  } catch (error) {
    console.error("Error registering hospital:", error);
    res.status(501).json({ msg: "internal server error" });
  }
};

const deleteHospital = async (req, res) => {
  try {
    const { role } = req.user;
    if (role != "Admin" || !role) {
      return res.status(404).json({
        msg: "only admins can add a hospital",
      });
    }

    const { hospitalId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      throw new Error("Invalid hospital ID format");
    }

    const deletedHospital = await Hospital.findByIdAndDelete(hospitalId);

    if (!deletedHospital) {
      return res.status(404).json({ msg: "Hospital not found" });
    }

    await HospitalAdministrator.deleteMany({ hospitalId });
    await doctor.deleteMany({ hospitalId });
    await Pharmacist.deleteMany({ hospitalId });
    await LabTechnician.deleteMany({ hospitalId });
    await triage.deleteMany({ hospitalId });

    res.status(201).json({ deletedHospital });
  } catch (error) {
    console.error("Error deleting hospital:", error);
    throw error;
    res.status(500).json({ msg: "internal server error" });
  }
};

const viewAllRecords = async (req, res) => {
  try {
    const { role } = req.user;

    if (role != "Admin" || !role) {
      return res.status(404).json({
        msg: "only admins can view all records",
      });
    }

    const data = await Patient.find({});

    res.status(200).json({ data });
  } catch (error) {
    console.log("Error at VIEW ALL RECORDS(SYSTEM ADMIN.JS", error.message);
    res.status(500).json({ msg: "internal server error" });
  }
};

const addHospitalAdmin = async (req, res) => {
  try {
    const { role } = req.user;

    if (role != "Admin" || !role) {
      return res.status(404).json({
        msg: "only admins can add a hospital",
      });
    }

    const userData = req.body;
    const {
      email,
      password,
      hospitalID,
      firstName,
      lastName,
      dateOfBirth,
      gender,
    } = userData;
    if (
      !email ||
      !password ||
      !hospitalID ||
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      !gender
    ) {
      return res.status(400).json({ msg: "Please fill all the inputs." });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ msg: "user already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);

    console.log(userData);
    const newHospitalAdmin = new HospitalAdministrator(userData);

    await newHospitalAdmin.save();

    res.status(200).json({
      msg: "you are now a hospital admin",
    });
  } catch (error) {
    console.log(
      "error at add hospital admin: systemAdminController",
      error.message
    );
    res.status(500).json({ msg: "internal server error" });
  }
};

module.exports = {
  deleteHospital,
  registerHospital,
  viewAllRecords,
  addHospitalAdmin,
};
