import { useEffect, useMemo, useState } from "react";
import { JdReportPanel } from "../../components/analysis/JdReportPanel";
import { JdSidebar } from "../../components/analysis/JdSidebar";
import { AppLayout } from "../../components/layout/AppLayout";
import { WorkspaceSplitLayout } from "../../components/layout/WorkspaceSplitLayout";
import { createAnalysisResumeDeck } from "../../data/analysis-resumes";
import { analyzeResumeAgainstJobDescription } from "../../lib/analysis";
import { useWorkspace } from "../workspace/WorkspaceContext";

export function JdPage() {
  const { jobDescription, resume, setJobDescription } = useWorkspace();
  const resumes = useMemo(() => createAnalysisResumeDeck(resume), [resume]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasRun, setHasRun] = useState(false);
  const selectedResume = resumes[selectedIndex] ?? resumes[0];
  const analysis = analyzeResumeAgainstJobDescription(selectedResume.resume, jobDescription);

  useEffect(() => {
    setSelectedIndex((current) => Math.min(current, Math.max(resumes.length - 1, 0)));
  }, [resumes.length]);

  useEffect(() => {
    setHasRun(false);
  }, [jobDescription, selectedIndex, selectedResume.resume.meta.updatedAt]);

  return (
    <AppLayout contentClassName="min-h-0 overflow-hidden px-6 py-6">
      <WorkspaceSplitLayout
        left={
          <JdSidebar
            currentIndex={selectedIndex}
            onNext={() => setSelectedIndex((current) => (current + 1) % resumes.length)}
            onPrevious={() => setSelectedIndex((current) => (current - 1 + resumes.length) % resumes.length)}
            resumes={resumes}
          />
        }
        right={
          <JdReportPanel
            analysis={analysis}
            hasJobDescription={Boolean(jobDescription.trim())}
            hasRun={hasRun}
            jobDescription={jobDescription}
            onJobDescriptionChange={setJobDescription}
            onRun={() => setHasRun(true)}
          />
        }
        variant="sidebar"
      />
    </AppLayout>
  );
}
