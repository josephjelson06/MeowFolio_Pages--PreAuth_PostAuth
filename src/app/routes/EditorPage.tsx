import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ResumePreview } from "../../components/editor/ResumePreview";
import { type EditorTabId } from "../../components/editor/EditorTabs";
import { EditorSidebar } from "../../components/editor/EditorSidebar";
import { AppLayout } from "../../components/layout/AppLayout";
import { WorkspaceSplitLayout } from "../../components/layout/WorkspaceSplitLayout";
import { isRenderTemplateId } from "../../data/templates";
import { useWorkspace } from "../workspace/WorkspaceContext";

function normalizeEditorTab(value: string | null): EditorTabId {
  return value === "templates" || value === "design" ? value : "content";
}

export function EditorPage() {
  const { clearResume, renderOptions, resume, setRenderOptions, setResume } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = normalizeEditorTab(searchParams.get("tab"));
  const requestedTemplate = searchParams.get("template");

  useEffect(() => {
    if (!isRenderTemplateId(requestedTemplate) || requestedTemplate === renderOptions.templateId) {
      return;
    }

    setRenderOptions({
      ...renderOptions,
      templateId: requestedTemplate
    });
  }, [renderOptions, requestedTemplate, setRenderOptions]);

  function updateSearch(next: Partial<Record<"tab" | "template", string | null>>) {
    const updated = new URLSearchParams(searchParams);

    Object.entries(next).forEach(([key, value]) => {
      if (!value) {
        updated.delete(key);
        return;
      }

      updated.set(key, value);
    });

    setSearchParams(updated, { replace: true });
  }

  return (
    <AppLayout contentClassName="min-h-0 overflow-hidden px-6 py-6">
      <WorkspaceSplitLayout
        left={
          <EditorSidebar
            activeTab={activeTab}
            resume={resume}
            renderOptions={renderOptions}
            onResumeChange={setResume}
            onRenderOptionsChange={setRenderOptions}
            onClearResume={clearResume}
            onTabChange={(tab) => updateSearch({ tab })}
            onTemplateChange={(templateId) => {
              setRenderOptions({
                ...renderOptions,
                templateId
              });
              updateSearch({
                tab: "templates",
                template: templateId
              });
            }}
          />
        }
        right={<ResumePreview resume={resume} renderOptions={renderOptions} />}
        variant="editor"
      />
    </AppLayout>
  );
}
