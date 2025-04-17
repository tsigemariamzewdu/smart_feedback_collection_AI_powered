const MedicalRecord = require('../models/MedicalRecord');


const updateMedicalRecord = async (req, res) => {
    try {
        const { medicalRecordId } = req.params;
        const { bloodPressure, heartRate, weight, temperature } = req.body;

        console.log("Updating medical record vitals:", { medicalRecordId, bloodPressure, heartRate, weight, temperature });

    
        const updatedRecord = await MedicalRecord.findByIdAndUpdate(
            medicalRecordId,
            { 
                $set: { 
                    "generalMeasurements.bloodPressure": bloodPressure,
                    "generalMeasurements.heartRate": heartRate,
                    "generalMeasurements.weight": weight,
                    "generalMeasurements.temperature": temperature
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedRecord) {
            return res.status(404).json({ message: "Medical Record not found" });
        }

        res.status(200).json({ message: "Medical Record updated successfully", updatedRecord });

    } catch (error) {
        console.error("Error updating medical record:", error);
        res.status(500).json({ message: "Error updating medical record", error: error.message });
    }
};

module.exports = { updateMedicalRecord };
