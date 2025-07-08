import { Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AddNewStaff from "./pages/admin/AddNewStaff";
import EditViewStaff from "./pages/admin/EditViewStaff";
import PatientRecord from "./pages/admin/PatientRecord";
import RecordAuditLogs from "./pages/admin/RecordAuditLogs";
import StaffManagement from "./pages/admin/StaffManagement";
import ViewRecords from "./pages/admin/ViewRecords";
import AdminAnalysis from './pages/AdminAnalysis';

// Receptionist pages
import ReceptionistDashboard from "./pages/receptionist/Dashboard";
import ReceptionistReviews from "./pages/receptionist/Review";

const AppRoutes = ({ userRole }) => {
  return (
    <Routes>
      {/* Admin Routes */}
      {userRole === "Admin" && (
        <>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/add-staff" element={<AddNewStaff />} />
          <Route path="/admin/edit-staff" element={<EditViewStaff />} />
          <Route path="/admin/patient-records" element={<PatientRecord />} />
          <Route path="/admin/audit-logs" element={<RecordAuditLogs />} />
          <Route path="/admin/staff-management" element={<StaffManagement />} />
          <Route path="/admin/view-records" element={<ViewRecords />} />
          <Route path="/admin-analysis" element={<AdminAnalysis />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
        </>
      )}

      {/* Receptionist Routes */}
      {userRole === "Receptionist" && (
        <>
          <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
          <Route path="/receptionist/review" element={<ReceptionistReviews />} />
          <Route path="/receptionist" element={<Navigate to="/receptionist/dashboard" />} />
        </>
      )}

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
