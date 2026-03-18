import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { TimerProvider } from "@/contexts/TimerContext";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminReports from "./pages/admin/AdminReports";
import AdminActivity from "./pages/admin/AdminActivity";
import AdminOrganization from "./pages/admin/AdminOrganization";
import AdminTrackedTime from "./pages/admin/AdminTrackedTime";
import AdminProductivity from "./pages/admin/AdminProductivity";
import AdminScreenshots from "./pages/admin/AdminScreenshots";
import AdminProfile from "./pages/admin/AdminProfile";

// Employee Pages
import EmployeeLayout from "./layouts/EmployeeLayout";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeTimer from "./pages/employee/EmployeeTimer";
import EmployeeTimesheets from "./pages/employee/EmployeeTimesheets";
import EmployeeProductivity from "./pages/employee/EmployeeProductivity";
import EmployeeActivities from "./pages/employee/EmployeeActivities";
import EmployeeProfile from "./pages/employee/EmployeeProfile";

const queryClient = new QueryClient();
const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' | 'employee' }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/home" element={<Index />} />

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />
          ) : (
            <Login />
          )
        }
      />

      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/projects" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminProjects /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/tasks" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminTasks /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminReports /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/activity" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminActivity /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/organization" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminOrganization /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/tracked-time" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminTrackedTime /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/productivity" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminProductivity /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/screenshots" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminScreenshots /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/profile" element={<ProtectedRoute requiredRole="admin"><AdminLayout><AdminProfile /></AdminLayout></ProtectedRoute>} />

      <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />
      <Route path="/employee/dashboard" element={<ProtectedRoute requiredRole="employee"><EmployeeLayout><EmployeeDashboard /></EmployeeLayout></ProtectedRoute>} />
      <Route path="/employee/timer" element={<ProtectedRoute requiredRole="employee"><EmployeeLayout><EmployeeTimer /></EmployeeLayout></ProtectedRoute>} />
      <Route path="/employee/timesheets" element={<ProtectedRoute requiredRole="employee"><EmployeeLayout><EmployeeTimesheets /></EmployeeLayout></ProtectedRoute>} />
      <Route path="/employee/productivity" element={<ProtectedRoute requiredRole="employee"><EmployeeLayout><EmployeeProductivity /></EmployeeLayout></ProtectedRoute>} />
      <Route path="/employee/activities" element={<ProtectedRoute requiredRole="employee"><EmployeeLayout><EmployeeActivities /></EmployeeLayout></ProtectedRoute>} />
      <Route path="/employee/profile" element={<ProtectedRoute requiredRole="employee"><EmployeeLayout><EmployeeProfile /></EmployeeLayout></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <TimerProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Router>
              <AppRoutes />
            </Router>
          </TooltipProvider>
        </TimerProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
