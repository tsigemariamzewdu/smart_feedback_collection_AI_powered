const LabRequest = require('../models/LabRequest');

// Fetch all lab requests
const getLabRequests = async (req, res) => {
    try {
        const labRequests = await LabRequest.find().populate('patientID doctorID');
        res.status(200).json(labRequests);
    } catch (error) {
        console.error("Error fetching lab requests:", error);
        res.status(500).json({ message: "Error fetching lab requests", error: error.message });
    }
};

// Update lab request status
const updateLabRequest = async (req, res) => {
    try {
        const { labRequestId } = req.params;
        const { status, completionDate } = req.body;

        if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const updatedLabRequest = await LabRequest.findByIdAndUpdate(
            labRequestId,
            { $set: { status, completionDate: status === 'Completed' ? new Date() : completionDate } },
            { new: true, runValidators: true }
        );

        if (!updatedLabRequest) {
            return res.status(404).json({ message: "Lab request not found" });
        }

        res.status(200).json({ message: "Lab request updated successfully", updatedLabRequest });
    } catch (error) {
        console.error("Error updating lab request:", error);
        res.status(500).json({ message: "Error updating lab request", error: error.message });
    }
};



module.exports = { getLabRequests, updateLabRequest };
