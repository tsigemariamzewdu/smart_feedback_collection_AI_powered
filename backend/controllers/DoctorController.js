const MedicalRecord = require("../models/MedicalRecord");
const Patient = require("../models/Patient");

const viewAssignedRecord = async (req, res) => {
  try {
    const { faydaId } = req.params;

    if (!faydaId) {
      return res.status(400).json({ msg: "Doctor ID is required" });
    }

    const data = await MedicalRecord.find({ faydaId });

    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ msg: "No medical records found for this doctor" });
    }

    res.status(200).json({
      msg: "Medical records retrieved successfully",
      data,
    });
  } catch (error) {
    console.log(
      "error at view assigned record: doctor controller",
      error.message
    );
    res.status(500).json({ msg: "Internal server error" });
  }
};

const sendLabRequest = async (req, res) => {
  try {
    const { patientID, doctorID, testType, status } = req.body;

    if (!patientID || !doctorID || !testType) {
      return res.status(400).json({
        msg: "Please provide patientID, doctorID, and testType",
      });
    }

    const newLabRequest = new LabRequest({
      patientID,
      doctorID,
      testType,
      status: status || "Pending",
    });

    await newLabRequest.save();

    res.status(201).json({
      msg: "Lab request sent successfully",
      labRequest: newLabRequest,
    });
  } catch (error) {
    console.log("error at send lab request", error.message);

    res.status(500).json({
      msg: "Internal server error",
    });
  }
};

const uploadRecord = async (req, res) => {
  try {
    const { faydaId, patientID, diagnosis, prescription } = req.params;
    const { doctorId } = req.user;
    const dateRecorded = new Date.now();

    if (!faydaId || !patientId || !diagnosis) {
      return res.status(400).json({
        message: "Record ID is required",
      });
    }

    const updatedRecord = await MedicalRecord.insert({
      faydaId,
      patientId,
      diagnosis,
      prescirption,
      dateRecorded,
      doctorId,
    });

    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error(
      "Error updating medical record: doctor controller",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const sendPrescription = async (req, res) => {
  try {
    const { patientID, doctorID, medicineList } = req.body;

    if (!patientID || !doctorID) {
      return res.status(400).json({
        success: false,
        msg: "Patient ID and Doctor ID are required",
      });
    }

    if (!medicineList || medicineList.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "At least one medicine is required in the prescription",
      });
    }

    const newPrescription = new Prescription({
      patientID,
      doctorID,
      medicineList,
      datePrescribed: new Date(),
      isFilled: false,
    });

    await newPrescription.save();

    res.status(201).json({
      msg: "Prescription created successfully",
      data: newPrescription,
    });
  } catch (error) {
    console.log("error at send prescription: doctor controller", error.message);

    res.status(500).json({
      msg: "Internal server error",
    });
  }
};
