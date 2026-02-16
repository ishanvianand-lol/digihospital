import { Toaster } from "../src/components/ui/toaster";
import { Toaster as Sonner } from "../src/components/ui/sonner";
import { TooltipProvider } from "../src/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import RoleSelect from "./pages/RoleSelect";           // ← NEW
import Onboarding from "./pages/Onboarding";
import DoctorOnboarding from "./pages/DoctorOnboarding"; // ← NEW
import DoctorDashboard from "./pages/Doctordashboard";
import Dashboard from "./pages/Dashboard";
import Emergency from "./pages/Emergency";
import DoctorAccess from "./pages/DoctorAccess";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/role-select" element={<RoleSelect />} />           {/* ← NEW */}
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/doctor-onboarding" element={<DoctorOnboarding />} />{/* ← NEW */}
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/doctor-access" element={<DoctorAccess />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;