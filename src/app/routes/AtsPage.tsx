import { useDeferredValue } from "react";
import { AtsReportPanel } from "../../components/analysis/AtsReportPanel";
import { AtsSidebar } from "../../components/analysis/AtsSidebar";
import { AppLayout } from "../../components/layout/AppLayout";
import { WorkspaceSplitLayout } from "../../components/layout/WorkspaceSplitLayout";
import { analyzeResumeForAts } from "../../lib/analysis";
import { useWorkspace } from "../workspace/WorkspaceContext";

export function AtsPage() {
  const { renderOptions, resume, setResume } = useWorkspace();
  const previewResume = useDeferredValue(resume);
  const previewRenderOptions = useDeferredValue(renderOptions);
  const analysis = analyzeResumeForAts(previewResume, previewRenderOptions);

  return (
    <AppLayout contentClassName="overflow-hidden px-6 py-6">
      <WorkspaceSplitLayout
        left={<AtsSidebar analysis={analysis} resume={resume} onResumeChange={setResume} />}
        right={<AtsReportPanel analysis={analysis} resume={previewResume} />}
        variant="sidebar"
      />
    </AppLayout>
  );
}
