import { useDeferredValue } from "react";
import { ResumePreview } from "../../components/editor/ResumePreview";
import { EditorSidebar } from "../../components/editor/EditorSidebar";
import { AppLayout } from "../../components/layout/AppLayout";
import { WorkspaceSplitLayout } from "../../components/layout/WorkspaceSplitLayout";
import { useWorkspace } from "../workspace/WorkspaceContext";

export function EditorPage() {
  const { clearResume, loadSampleResume, renderOptions, resume, setRenderOptions, setResume } = useWorkspace();
  const previewResume = useDeferredValue(resume);
  const previewRenderOptions = useDeferredValue(renderOptions);

  return (
    <AppLayout contentClassName="overflow-hidden px-6 py-6">
      <WorkspaceSplitLayout
        left={
          <EditorSidebar
            resume={resume}
            renderOptions={renderOptions}
            onResumeChange={setResume}
            onRenderOptionsChange={setRenderOptions}
            onLoadSample={loadSampleResume}
            onClearResume={clearResume}
          />
        }
        right={<ResumePreview resume={previewResume} renderOptions={previewRenderOptions} />}
        variant="editor"
      />
    </AppLayout>
  );
}
