import { useDeferredValue, useState } from "react";
import { createMockResumeData } from "../../data/editor";
import { ResumePreview } from "../../components/editor/ResumePreview";
import { EditorSidebar } from "../../components/editor/EditorSidebar";
import { AppLayout } from "../../components/layout/AppLayout";
import { WorkspaceSplitLayout } from "../../components/layout/WorkspaceSplitLayout";
import { createEmptyResumeData, type ResumeData } from "../../types/resume";

export function EditorPage() {
  const [resume, setResume] = useState<ResumeData>(() => createMockResumeData());
  const previewResume = useDeferredValue(resume);

  function updateResume(next: ResumeData) {
    setResume({
      ...next,
      meta: {
        ...next.meta,
        updatedAt: new Date().toISOString()
      }
    });
  }

  return (
    <AppLayout contentClassName="overflow-hidden px-6 py-6">
      <WorkspaceSplitLayout
        left={
          <EditorSidebar
            resume={resume}
            onResumeChange={updateResume}
            onLoadSample={() => setResume(createMockResumeData())}
            onClearResume={() => setResume(createEmptyResumeData("scratch"))}
          />
        }
        right={<ResumePreview resume={previewResume} />}
        variant="editor"
      />
    </AppLayout>
  );
}
