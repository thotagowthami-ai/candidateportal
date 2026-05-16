import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import UploadResume from "./pages/UploadResume";
import RegistrationSuccess from "./pages/RegistrationSuccess";
import ResumeViewer from "./pages/ResumeViewer";
import Settings from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
function ProtectedRoute() {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("authToken"));

  useEffect(() => {
    const onAuthChanged = () => setAuthToken(localStorage.getItem("authToken"));
    window.addEventListener("auth:changed", onAuthChanged);
    return () => window.removeEventListener("auth:changed", onAuthChanged);
  }, []);

  if (!authToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function VerifyRoute() {
  const email = sessionStorage.getItem("email");

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  return <Outlet />;
}

function UploadRoute() {
  const registerData = sessionStorage.getItem("registerData");

  if (!registerData) {
    return <Navigate to="/register" replace />;
  }

  return <Outlet />;
}

function SuccessRoute() {
  const registrationDone = sessionStorage.getItem("registrationDone");

  if (registrationDone !== "true") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Landing />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route element={<VerifyRoute />}>
          <Route path="/verify" element={<VerifyOtp />} />
        </Route>
        <Route element={<UploadRoute />}>
          <Route path="/upload" element={<UploadResume />} />
        </Route>
        <Route element={<SuccessRoute />}>
          <Route path="/success" element={<RegistrationSuccess />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/resume" element={<ResumeViewer />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Navigate to="/settings" replace />} />
          <Route path="/match" element={<Navigate to="/resume" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
