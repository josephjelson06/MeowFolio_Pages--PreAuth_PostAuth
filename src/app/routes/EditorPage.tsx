import { EditorSidebar } from "../../components/editor/EditorSidebar";
import { ResumePreview } from "../../components/editor/ResumePreview";
import { AppLayout } from "../../components/layout/AppLayout";
import { WorkspaceSplitLayout } from "../../components/layout/WorkspaceSplitLayout";

export function EditorPage() {
  return (
    <AppLayout contentClassName="overflow-hidden px-6 py-6">
      <WorkspaceSplitLayout left={<EditorSidebar />} right={<ResumePreview />} variant="editor" />
    </AppLayout>
  );
}
