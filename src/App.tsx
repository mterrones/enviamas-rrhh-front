import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { InactivitySessionWatcher } from "@/components/auth/InactivitySessionWatcher";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { HomeEntry } from "@/components/auth/HomeEntry";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import EmployeesPage from "./pages/EmployeesPage";
import EmployeeProfilePage from "./pages/EmployeeProfilePage";
import NewEmployeePage from "./pages/NewEmployeePage";
import EditEmployeePage from "./pages/EditEmployeePage";
import AttendancePage from "./pages/AttendancePage";
import PayrollPage from "./pages/PayrollPage";
import EmployeePortalPage from "./pages/EmployeePortalPage";
import AssetsPage from "./pages/AssetsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilesPage from "./pages/ProfilesPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
      <NotificationsProvider>
      <BrowserRouter>
        <InactivitySessionWatcher />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomeEntry />} />
              <Route
                path="/empleados"
                element={
                  <RequirePermission permission="employees.view">
                    <EmployeesPage />
                  </RequirePermission>
                }
              />
              <Route
                path="/empleados/nuevo"
                element={
                  <RequirePermission permission="employees.create">
                    <NewEmployeePage />
                  </RequirePermission>
                }
              />
              <Route
                path="/empleados/:id/edit"
                element={
                  <RequirePermission permission="employees.edit">
                    <EditEmployeePage />
                  </RequirePermission>
                }
              />
              <Route
                path="/empleados/:id"
                element={
                  <RequirePermission permission="employees.view">
                    <EmployeeProfilePage />
                  </RequirePermission>
                }
              />
              <Route
                path="/asistencia"
                element={
                  <RequirePermission permission="attendance.view">
                    <AttendancePage />
                  </RequirePermission>
                }
              />
              <Route
                path="/boletas"
                element={
                  <RequirePermission permission="payroll.view">
                    <PayrollPage />
                  </RequirePermission>
                }
              />
              <Route
                path="/portal"
                element={
                  <RequirePermission permission="portal.view">
                    <EmployeePortalPage />
                  </RequirePermission>
                }
              />
              <Route
                path="/activos"
                element={
                  <RequirePermission permission="assets.view">
                    <AssetsPage />
                  </RequirePermission>
                }
              />
              <Route
                path="/reportes"
                element={
                  <RequirePermission permission="reports.view">
                    <ReportsPage />
                  </RequirePermission>
                }
              />
              <Route
                path="/perfiles"
                element={
                  <RequirePermission permission="settings.profiles">
                    <ProfilesPage />
                  </RequirePermission>
                }
              />
              <Route
                path="/configuracion"
                element={
                  <RequirePermission permission="settings.view">
                    <SettingsPage />
                  </RequirePermission>
                }
              />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </NotificationsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
