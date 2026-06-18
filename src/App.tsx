import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "./store/slices/authSlice";
import { USER_ROLES, VERIFICATION_STATUS } from "./constants";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import LoginPage from "./pages/auth/LoginPage";
import OtpLoginPage from "./pages/auth/OtpLoginPage";
import ParentLoginPage from "./pages/auth/ParentLoginPage";
import StudentLoginPage from "./pages/auth/StudentLoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import ClassLeadsListPage from "./pages/classLeads/ClassLeadsListPage";
import CreateClassLeadPage from "./pages/classLeads/CreateClassLeadPage";
import ClassLeadDetailPage from "./pages/classLeads/ClassLeadDetailPage";
import EditClassLeadPage from "./pages/classLeads/EditClassLeadPage";
import AttendanceListPage from "./pages/attendance/AttendanceListPage";
import PaymentsListPage from "./pages/payments/PaymentsListPage";
import PaymentDetailPage from "./pages/payments/PaymentDetailPage";
import TutorVerificationPage from "./pages/tutors/TutorVerificationPage";
import ManagerProfilePage from "./pages/manager/ManagerProfilePage";
import ManagerVerificationPage from "./pages/manager/ManagerVerificationPage";
import CoordinatorDashboardPage from "./pages/coordinator/CoordinatorDashboardPage";
import AssignedClassesPage from "./pages/coordinator/AssignedClassesPage";
import AttendanceSheetApprovalsPage from "./pages/coordinator/AttendanceSheetApprovalsPage";
import ClassDetailPage from "./pages/coordinator/ClassDetailPage";
import CoordinatorAttendancePage from "./pages/coordinator/CoordinatorAttendancePage";
import CoordinatorPaymentsPage from "./pages/coordinator/CoordinatorPaymentsPage";
import AttendanceApprovalPage from "./pages/coordinator/AttendanceApprovalPage";
import TestSchedulingPage from "./pages/coordinator/TestSchedulingPage";
import SendAnnouncementPage from "./pages/coordinator/SendAnnouncementPage";
import TodayTasksPage from "./pages/coordinator/TodayTasksPage";
import TestReportAnalysisPage from "./pages/coordinator/TestReportAnalysisPage";
import TutorPerformancePage from "./pages/coordinator/TutorPerformancePage";
import PaymentTrackingPage from "./pages/coordinator/PaymentTrackingPage";
import CoordinatorProfilePage from "./pages/coordinator/CoordinatorProfilePage";
import ShiftRequestsPage from "./pages/coordinator/ShiftRequestsPage";
import ClassRequestsPage from "./pages/manager/ClassRequestsPage";
import CoordinatorAttendanceSheetTablePage from "./pages/coordinator/CoordinatorAttendanceSheetTablePage";
import CoordinatorsPage from "./pages/manager/CoordinatorsPage";
import ManagerTodayTasksPage from "./pages/manager/ManagerTodayTasksPage";
import ManagerAnalyticsPage from "./pages/manager/ManagerAnalyticsPage";
import ManagerLeadCRMPage from "./pages/manager/LeadCRMPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdvancedAnalyticsPage from "./pages/admin/AdvancedAnalyticsPage";
import AdminProfilePage from "./pages/admin/AdminProfilePage";
import ManagersManagementPage from "./pages/admin/ManagersManagementPage";
import CoordinatorsManagementPage from "./pages/admin/CoordinatorsManagementPage";
import CoordinatorVerificationPage from "./pages/admin/CoordinatorVerificationPage";
import FinalClassesManagementPage from "./pages/admin/FinalClassesManagementPage";
import DataManagementPage from "./pages/admin/DataManagementPage";
import TutorDashboardPage from "./pages/tutors/TutorDashboardPage";
import TutorClassesPage from "./pages/tutors/TutorClassesPage";
import TutorRegistrationPage from "./pages/tutors/TutorRegistrationPage";
import TutorVerificationDetailsPage from "./pages/tutors/TutorVerificationDetailsPage";
import TutorTimetablePage from "./pages/tutors/TutorTimetablePage";
import TutorPaymentsPage from "./pages/tutors/TutorPaymentsPage";
import TutorProfilePage from "./pages/tutors/TutorProfilePage";
import TutorAttendancePage from "./pages/tutors/TutorAttendancePage";
import TutorAttendanceSheetTablePage from "./pages/tutors/TutorAttendanceSheetTablePage";
import TutorLeadsPage from "./pages/tutors/TutorLeadsPage";
import TutorNotesPage from "./pages/tutors/TutorNotesPage";
import TutorTestsPage from "./pages/tutors/TutorTestsPage";
import ClassAttendanceSheetPage from "./pages/tutors/ClassAttendanceSheetPage";
import TutorVerificationFormPage from "./pages/tutors/TutorVerificationFormPage";
import NotesDrivePage from "./pages/notes/NotesDrivePage";
import TutorPublicProfilePage from "./pages/public/TutorPublicProfilePage";
import RequestTutorPage from "./pages/public/RequestTutorPage";
import PublicLeadDetails from "./pages/public/PublicLeadDetails";
import CoordinatorSettingsPage from "./pages/coordinator/CoordinatorSettingsPage";
import CoordinatorVerificationPageSelf from "./pages/coordinator/CoordinatorVerificationPage";
import ParentDashboardPage from "./pages/parent/ParentDashboardPage";
import ParentAttendancePage from "./pages/parent/ParentAttendancePage";
import ParentPaymentsPage from "./pages/parent/ParentPaymentsPage";
import ParentTestsPage from "./pages/parent/ParentTestsPage";
import ParentNotesPage from "./pages/parent/ParentNotesPage";
import StudentDashboardPage from "./pages/student/StudentDashboardPage";
import StudentProfilePage from "./pages/student/StudentProfilePage";
import StudentChangePasswordPage from "./pages/student/StudentChangePasswordPage";
import StudentLayout from "./components/layout/StudentLayout";
import StudentClassesPage from "./pages/student/StudentClassesPage";
import StudentAttendancePage from "./pages/student/StudentAttendancePage";
import StudentTestsPage from "./pages/student/StudentTestsPage";
import StudentNotesPage from "./pages/student/StudentNotesPage";
import StudentPaymentsPage from "./pages/student/StudentPaymentsPage";
import StudentTestDetailPage from "./pages/student/StudentTestDetailPage";
import OptionsManagementPage from "./pages/admin/OptionsManagementPage";
import AdminStudentProfilePage from "./pages/admin/AdminStudentProfilePage";
import ApprovalsManagementPage from "./pages/admin/ApprovalsManagementPage";
import AdminNotificationsPage from "./pages/admin/NotificationsPage";
import CoordinatorNotificationsPage from "./pages/coordinator/NotificationsPage";
import { useAuth } from "./hooks/useAuth";

const App: React.FC = () => {
  const { refreshProfile, isAuthenticated } = useAuth();
  React.useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable common developer tool shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
      }
      // Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Elements)
      if (
        e.ctrlKey &&
        e.shiftKey &&
        (e.key === "I" || e.key === "J" || e.key === "C")
      ) {
        e.preventDefault();
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
      }
      // Ctrl+S (Save Page)
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) {
      refreshProfile();
    }
  }, [isAuthenticated, refreshProfile]);

  const RoleBasedDashboard: React.FC = () => {
    const user = useSelector(selectCurrentUser);
    const role = user?.role;


    if (role === USER_ROLES.ADMIN) {
      return <Navigate to="/admin-dashboard" replace />;
    }
    if (role === USER_ROLES.COORDINATOR) {
      if (user?.verificationStatus === VERIFICATION_STATUS.PENDING) {
        return <Navigate to="/coordinator-verification" replace />;
      }
      return <Navigate to="/coordinator-dashboard" replace />;
    }
    if (role === USER_ROLES.TUTOR) {
      return <Navigate to="/tutor-dashboard" replace />;
    }
    if (role === USER_ROLES.PARENT) {
      return <Navigate to="/parent-dashboard" replace />;
    }
    if (role === USER_ROLES.STUDENT) {
      return <Navigate to="/student-dashboard" replace />;
    }
    return <DashboardPage />;


    
  };

  const RoleBasedProfile: React.FC = () => {
    const user = useSelector(selectCurrentUser);
    const role = user?.role;

    if (role === USER_ROLES.TUTOR) {
      return <TutorProfilePage />;
    }
    if (role === USER_ROLES.COORDINATOR) {
      return <CoordinatorProfilePage />;
    }
    if (role === USER_ROLES.ADMIN) {
      return <AdminProfilePage />;
    }
    // Default to manager profile for MANAGER or unknown roles
    return <ManagerProfilePage />;
  };

  return (
    <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login-otp" element={<OtpLoginPage />} />
            <Route path="/parent-login" element={<ParentLoginPage />} />
            <Route path="/student-login" element={<StudentLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/tutor-register" element={<TutorRegistrationPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
                <Route index element={<RoleBasedDashboard />} />
                <Route
                  path="attendance-sheet-approvals"
                  element={
                    <ProtectedRoute allowedRoles={[USER_ROLES.COORDINATOR, USER_ROLES.ADMIN]}>
                      <AttendanceSheetApprovalsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="coordinator-dashboard"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.COORDINATOR, USER_ROLES.ADMIN]}
                  >
                    <CoordinatorDashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="coordinator-verification"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.COORDINATOR]}>
                    <CoordinatorVerificationPageSelf />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tutor-dashboard"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.TUTOR]}>
                    <TutorDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tutor-classes"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.TUTOR]}>
                    <TutorClassesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tutor-classes/:classId/attendance"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.TUTOR]}>
                    <ClassAttendanceSheetPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tutor-timetable"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.TUTOR]}>
                    <TutorTimetablePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tutor-payments"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.TUTOR]}>
                    <TutorPaymentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tutor-attendance"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.TUTOR]}>
                    <TutorAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tutor-attendance-sheet"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.TUTOR]}>
                    <TutorAttendanceSheetTablePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tutor-tests"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.TUTOR]}>
                    <TutorTestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tutor-leads"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.TUTOR]}>
                    <TutorLeadsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tutor-verification-form"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.TUTOR]}>
                    <TutorVerificationFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tutor-notes"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.TUTOR]}>
                    <TutorNotesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="notes"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      USER_ROLES.ADMIN,
                      USER_ROLES.TUTOR,
                      USER_ROLES.COORDINATOR,
                      USER_ROLES.STUDENT,
                      USER_ROLES.PARENT,
                    ]}
                  >
                    <NotesDrivePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="today-tasks"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.COORDINATOR, USER_ROLES.ADMIN]}
                  >
                    <TodayTasksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="assigned-classes"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.COORDINATOR, USER_ROLES.ADMIN]}
                  >
                    <AssignedClassesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="classes/:classId"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.COORDINATOR, USER_ROLES.ADMIN]}>
                    <ClassDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="coordinator/attendance/:classId"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                    <CoordinatorAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="coordinator/payments/:classId"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.COORDINATOR, USER_ROLES.ADMIN]}>
                    <CoordinatorPaymentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="attendance-approvals"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.ADMIN]}
                  >
                    <AttendanceApprovalPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="shift-requests"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.COORDINATOR, USER_ROLES.ADMIN]}
                  >
                    <ShiftRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="test-scheduling"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.COORDINATOR, USER_ROLES.ADMIN]}
                  >
                    <TestSchedulingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="announcements"
                element={<Navigate to="/notifications" replace />}
              />
              <Route
                path="notifications"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.COORDINATOR]}>
                    <CoordinatorNotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="test-reports"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.COORDINATOR, USER_ROLES.ADMIN]}
                  >
                    <TestReportAnalysisPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tutor-performance"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.COORDINATOR, USER_ROLES.ADMIN]}
                  >
                    <TutorPerformancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payment-tracking"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.COORDINATOR, USER_ROLES.ADMIN]}
                  >
                    <PaymentTrackingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="coordinator-settings"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.COORDINATOR, USER_ROLES.ADMIN]}
                  >
                    <CoordinatorSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="coordinator-profile"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.COORDINATOR, USER_ROLES.ADMIN]}
                  >
                    <CoordinatorProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="coordinator-attendance-sheet"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.COORDINATOR, USER_ROLES.ADMIN]}
                  >
                    <CoordinatorAttendanceSheetTablePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="admin-dashboard"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin-profile"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                    <AdminProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="manager-today-tasks"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.MANAGER, USER_ROLES.ADMIN]}
                  >
                    <ManagerTodayTasksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="parent-dashboard"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.PARENT]}>
                    <ParentDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="parent-attendance"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.PARENT]}>
                    <ParentAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="parent-payments"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.PARENT]}>
                    <ParentPaymentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="parent-test"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.PARENT]}>
                    <ParentTestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="parent-notes"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.PARENT]}>
                    <ParentNotesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                    <Outlet />
                  </ProtectedRoute>
                }
              >
                <Route path="managers" element={<ManagersManagementPage />} />
                <Route
                  path="coordinators"
                  element={<CoordinatorsManagementPage />}
                />
                <Route
                  path="verify-coordinators"
                  element={<CoordinatorVerificationPage />}
                />
                <Route
                  path="final-classes"
                  element={<FinalClassesManagementPage />}
                />
                <Route
                  path="data-management"
                  element={<DataManagementPage />}
                />
                <Route path="options" element={<OptionsManagementPage />} />
                <Route
                  path="student-profile/:id"
                  element={<AdminStudentProfilePage />}
                />
                <Route path="approvals" element={<ApprovalsManagementPage />} />
                <Route path="analytics" element={<AdvancedAnalyticsPage />} />
                <Route path="verify-manager/:id" element={<ManagerVerificationPage />} />
                <Route path="notifications" element={<AdminNotificationsPage />} />
                <Route path="banner-notifications" element={<Navigate to="/admin/notifications" replace />} />
              </Route>
              <Route
                path="class-requests"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER, USER_ROLES.ADMIN]}>
                    <ClassRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="class-leads"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.MANAGER, USER_ROLES.ADMIN]}
                  >
                    <Outlet />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ClassLeadsListPage />} />
                <Route path="new" element={<CreateClassLeadPage />} />
                <Route path=":id" element={<ClassLeadDetailPage />} />
                <Route path=":id/edit" element={<EditClassLeadPage />} />
              </Route>
              <Route
                path="tutors"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.MANAGER, USER_ROLES.ADMIN]}
                  >
                    <TutorVerificationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tutors/verify/:id"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.MANAGER, USER_ROLES.ADMIN]}
                  >
                    <TutorVerificationDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="coordinators"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.MANAGER, USER_ROLES.ADMIN]}
                  >
                    <CoordinatorsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="attendance"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.MANAGER, USER_ROLES.ADMIN]}
                  >
                    <AttendanceListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payments"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.MANAGER, USER_ROLES.ADMIN]}
                  >
                    <Outlet />
                  </ProtectedRoute>
                }
              >
                <Route index element={<PaymentsListPage />} />
                <Route path=":id" element={<PaymentDetailPage />} />
              </Route>
              <Route
                path="analytics"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.MANAGER, USER_ROLES.ADMIN]}
                  >
                    <ManagerAnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="manager/leads-crm"
                element={
                  <ProtectedRoute
                    allowedRoles={[USER_ROLES.MANAGER, USER_ROLES.ADMIN]}
                  >
                    <ManagerLeadCRMPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="manager-verification"
                element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
                    <ManagerVerificationPage />
                  </ProtectedRoute>
                }
              />

              <Route path="profile" element={<RoleBasedProfile />} />
              <Route path="tutor-profile/:id?" element={<TutorProfilePage />} />
              <Route
                path="manager-profile/:id?"
                element={<ManagerProfilePage />}
              />
              <Route
                path="coordinator-profile/:id?"
                element={<CoordinatorProfilePage />}
              />
            </Route>

            {/* Student Routes - Navbar Only */}
            <Route
              path="/student-dashboard"
              element={
                <ProtectedRoute studentRoute={true}>
                  <StudentLayout>
                    <StudentDashboardPage />
                  </StudentLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-profile/:id?"
              element={
                <ProtectedRoute
                  studentRoute={false}
                  allowedRoles={[
                    USER_ROLES.STUDENT,
                    USER_ROLES.ADMIN,
                    USER_ROLES.MANAGER,
                  ]}
                >
                  <StudentLayout>
                    <StudentProfilePage />
                  </StudentLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-change-password"
              element={
                <ProtectedRoute studentRoute={true}>
                  <StudentLayout>
                    <StudentChangePasswordPage />
                  </StudentLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-classes"
              element={
                <ProtectedRoute studentRoute={true}>
                  <StudentLayout>
                    <StudentClassesPage />
                  </StudentLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-attendance"
              element={
                <ProtectedRoute studentRoute={true}>
                  <StudentLayout>
                    <StudentAttendancePage />
                  </StudentLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-tests"
              element={
                <ProtectedRoute studentRoute={true}>
                  <StudentLayout>
                    <StudentTestsPage />
                  </StudentLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-tests/:id"
              element={
                <ProtectedRoute studentRoute={true}>
                  <StudentLayout>
                    <StudentTestDetailPage />
                  </StudentLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-notes"
              element={
                <ProtectedRoute studentRoute={true}>
                  <StudentLayout>
                    <StudentNotesPage />
                  </StudentLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-payments"
              element={
                <ProtectedRoute studentRoute={true}>
                  <StudentLayout>
                    <StudentPaymentsPage />
                  </StudentLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="ourtutor/:teacherId"
              element={<TutorPublicProfilePage />}
            />
            <Route path="/request-tutor" element={<RequestTutorPage />} />
            <Route path="/leads/public/:id" element={<PublicLeadDetails />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
  );
};

export default App;

