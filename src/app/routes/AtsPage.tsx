import { useEffect, useMemo, useState } from "react";
import { AtsReportPanel } from "../../components/analysis/AtsReportPanel";
import { AtsSidebar } from "../../components/analysis/AtsSidebar";
import { AppLayout } from "../../components/layout/AppLayout";
import { WorkspaceSplitLayout } from "../../components/layout/WorkspaceSplitLayout";
import { createAnalysisResumeDeck } from "../../data/analysis-resumes";
import { analyzeResumeForAts } from "../../lib/analysis";
import { useWorkspace } from "../workspace/WorkspaceContext";

export function AtsPage() {
  const { renderOptions, resume } = useWorkspace();
  const resumes = useMemo(() => createAnalysisResumeDeck(resume), [resume]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasRun, setHasRun] = useState(false);
  const selectedResume = resumes[selectedIndex] ?? resumes[0];
  const sectionOrderKey = renderOptions.sectionOrder.join("|");
  const analysis = analyzeResumeForAts(selectedResume.resume, renderOptions);

  useEffect(() => {
    setSelectedIndex((current) => Math.min(current, Math.max(resumes.length - 1, 0)));
  }, [resumes.length]);

  useEffect(() => {
    setHasRun(false);
  }, [
    selectedIndex,
    selectedResume.resume.meta.updatedAt,
    renderOptions.fontSize,
    renderOptions.margin,
    renderOptions.maxBulletsPerEntry,
    renderOptions.pageLimit,
    renderOptions.templateId,
    sectionOrderKey
  ]);

  return (
    <AppLayout contentClassName="min-h-0 overflow-hidden px-6 py-6">
      <WorkspaceSplitLayout
        left={
          <AtsSidebar
            currentIndex={selectedIndex}
            onNext={() => setSelectedIndex((current) => (current + 1) % resumes.length)}
            onPrevious={() => setSelectedIndex((current) => (current - 1 + resumes.length) % resumes.length)}
            resumes={resumes}
          />
        }
        right={<AtsReportPanel analysis={analysis} hasRun={hasRun} onRun={() => setHasRun(true)} resume={selectedResume.resume} />}
        variant="sidebar"
      />
    </AppLayout>
  );
}
