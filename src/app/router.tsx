import { AboutPage } from "./routes/AboutPage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AtsPage } from "./routes/AtsPage";
import { ChapterPage } from "./routes/ChapterPage";
import { ChoosePathPage } from "./routes/ChoosePathPage";
import { DashboardPage } from "./routes/DashboardPage";
import { EditorPage } from "./routes/EditorPage";
import { ErrorPage } from "./routes/ErrorPage";
import { JdPage } from "./routes/JdPage";
import { LandingPage } from "./routes/LandingPage";
import { LearnPage } from "./routes/LearnPage";
import { NotFoundPage } from "./routes/NotFoundPage";
import { ResumesPage } from "./routes/ResumesPage";
import { TemplatesPage } from "./routes/TemplatesPage";
import { WorkspaceProvider } from "./workspace/WorkspaceContext";

export function AppRouter() {
  return (
    <BrowserRouter>
      <WorkspaceProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/:chapterId" element={<ChapterPage />} />
          <Route path="/choose-path" element={<ChoosePathPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/error" element={<ErrorPage />} />
          <Route path="/500" element={<ErrorPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/resumes" element={<ResumesPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/ats" element={<AtsPage />} />
          <Route path="/jd" element={<JdPage />} />
          <Route path="/not-found" element={<NotFoundPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </WorkspaceProvider>
    </BrowserRouter>
  );
}
