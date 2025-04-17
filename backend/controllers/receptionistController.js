const Patient = require("../models/Patient");

const registerPatient = async (req, res) => {
  try {
    const {
      faydaID,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      contactNumber,
      address,
      emergencyContact,
      medicalHistory,
      registeredHospital,
    } = req.body;

    if (
      !faydaID ||
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      !gender ||
      !contactNumber ||
      !address ||
      !emergencyContact
    ) {
      return res.status(400).json({ msg: "Please fill all required fields" });
    }

    const newPatient = new Patient({
      faydaID,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      contactNumber,
      address,
      emergencyContact,
      medicalHistory: medicalHistory || "",
      registeredHospital: registeredHospital || null,
    });

    await newPatient.save();

    res.status(201).json({
      msg: "Patient registered successfully",
      patient: newPatient,
    });
  } catch (error) {
    console.log("error at register patient", error.message);
    if (error.code === 11000) {
      return res.status(400).json({ msg: "Fayda ID already exists" });
    }
    res.status(500).json({ msg: "Internal server error" });
  }
};

const generateReport = async (req, res) => {
  try {
  } catch (error) {
    console.log(
      "error at view generate report: receptionist controller",
      error.message
    );

    res.status(500).json({ msg: "Internal server error" });
  }
};

module.exports = { registerPatient, generateReport };
