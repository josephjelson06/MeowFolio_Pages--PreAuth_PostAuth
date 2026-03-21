import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AtsPage } from "./routes/AtsPage";
import { DashboardPage } from "./routes/DashboardPage";
import { EditorPage } from "./routes/EditorPage";
import { JdPage } from "./routes/JdPage";
import { LandingPage } from "./routes/LandingPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/ats" element={<AtsPage />} />
        <Route path="/jd" element={<JdPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
