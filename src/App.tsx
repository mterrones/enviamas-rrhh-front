import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import EmployeeProfilePage from "./pages/EmployeeProfilePage";
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
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/empleados" element={<EmployeesPage />} />
            <Route path="/empleados/:id" element={<EmployeeProfilePage />} />
            <Route path="/asistencia" element={<AttendancePage />} />
            <Route path="/boletas" element={<PayrollPage />} />
            <Route path="/portal" element={<EmployeePortalPage />} />
            <Route path="/activos" element={<AssetsPage />} />
            <Route path="/reportes" element={<ReportsPage />} />
            <Route path="/perfiles" element={<ProfilesPage />} />
            <Route path="/configuracion" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
