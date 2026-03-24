import { useDeferredValue } from "react";
import { JdReportPanel } from "../../components/analysis/JdReportPanel";
import { JdSidebar } from "../../components/analysis/JdSidebar";
import { AppLayout } from "../../components/layout/AppLayout";
import { WorkspaceSplitLayout } from "../../components/layout/WorkspaceSplitLayout";
import { analyzeResumeAgainstJobDescription } from "../../lib/analysis";
import { useWorkspace } from "../workspace/WorkspaceContext";

export function JdPage() {
  const { jobDescription, resume, setJobDescription, setResume } = useWorkspace();
  const previewResume = useDeferredValue(resume);
  const previewJobDescription = useDeferredValue(jobDescription);
  const analysis = analyzeResumeAgainstJobDescription(previewResume, previewJobDescription);

  return (
    <AppLayout contentClassName="overflow-hidden px-6 py-6">
      <WorkspaceSplitLayout
        left={
          <JdSidebar
            analysis={analysis}
            jobDescription={jobDescription}
            onJobDescriptionChange={setJobDescription}
            onResumeChange={setResume}
            resume={resume}
          />
        }
        right={<JdReportPanel analysis={analysis} hasJobDescription={Boolean(previewJobDescription.trim())} />}
        variant="analysis"
      />
    </AppLayout>
  );
}
