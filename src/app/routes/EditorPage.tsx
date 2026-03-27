import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchCompilerHealth, requestCompiledPdf } from "../../lib/render-client";
import { ResumePreview } from "../../components/editor/ResumePreview";
import { type EditorTabId, EditorTabs } from "../../components/editor/EditorTabs";
import { EditorSidebar } from "../../components/editor/EditorSidebar";
import { AppLayout } from "../../components/layout/AppLayout";
import { Button } from "../../components/ui/Button";
import { isRenderTemplateId } from "../../data/templates";
import type { CompilerHealthResponse } from "../../types/render";
import { useWorkspace } from "../workspace/WorkspaceContext";

function normalizeEditorTab(value: string | null): EditorTabId {
  return value === "templates" || value === "design" ? value : "content";
}

type CompileState = "error" | "idle" | "success" | "compiling";

export function EditorPage() {
  const { clearResume, renderOptions, resume, setRenderOptions, setResume } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = normalizeEditorTab(searchParams.get("tab"));
  const requestedTemplate = searchParams.get("template");
  const [compilerHealth, setCompilerHealth] = useState<CompilerHealthResponse | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [compileState, setCompileState] = useState<CompileState>("idle");
  const [lastCompiledFingerprint, setLastCompiledFingerprint] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const compileRunRef = useRef(0);
  const previousTemplateIdRef = useRef(renderOptions.templateId);
  const compileFingerprint = useMemo(() => JSON.stringify({ renderOptions, resume }), [renderOptions, resume]);
  const previewStale = lastCompiledFingerprint !== null && lastCompiledFingerprint !== compileFingerprint;

  useEffect(() => {
    if (!isRenderTemplateId(requestedTemplate) || requestedTemplate === renderOptions.templateId) {
      return;
    }

    setRenderOptions({
      ...renderOptions,
      templateId: requestedTemplate
    });
  }, [renderOptions, requestedTemplate, setRenderOptions]);

  useEffect(() => {
    let active = true;

    fetchCompilerHealth()
      .then((health) => {
        if (active) {
          setCompilerHealth(health);
        }
      })
      .catch((error) => {
        if (active) {
          setCompileError(error instanceof Error ? error.message : "Failed to reach compile service.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (previousTemplateIdRef.current === renderOptions.templateId) {
      return;
    }

    previousTemplateIdRef.current = renderOptions.templateId;

    setPdfUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return null;
    });
  }, [renderOptions.templateId]);

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

  async function handleCompile() {
    if (!compilerHealth?.engineAvailable) {
      return;
    }

    const runId = ++compileRunRef.current;

    setCompileState("compiling");
    setCompileError(null);

    try {
      const pdfBlob = await requestCompiledPdf({ options: renderOptions, resume });

      if (compileRunRef.current !== runId) {
        return;
      }

      const nextUrl = URL.createObjectURL(pdfBlob);

      setPdfUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return nextUrl;
      });

      setLastCompiledFingerprint(compileFingerprint);
      setCompileState("success");
    } catch (error) {
      if (compileRunRef.current !== runId) {
        return;
      }

      setCompileState("error");
      setCompileError(error instanceof Error ? error.message : "PDF compilation failed.");
    }
  }

  return (
    <AppLayout contentClassName="min-h-0 px-6 py-6">
      <div className="flex h-full min-h-0 flex-col gap-6">
        <div className="shrink-0 space-y-4">
          <EditorTabs activeTab={activeTab} onTabChange={(tab) => updateSearch({ tab })} />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              icon="picture_as_pdf"
              onClick={handleCompile}
              disabled={compileState === "compiling" || !compilerHealth?.engineAvailable}
            >
              {compileState === "compiling" ? "Rendering..." : pdfUrl ? "Re-render PDF" : "Render PDF"}
            </Button>
            <Button variant="surface" icon="ink_eraser" onClick={clearResume}>
              Clear
            </Button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 w-full grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="min-h-0 min-w-0 overflow-hidden">
          <EditorSidebar
            activeTab={activeTab}
            resume={resume}
            renderOptions={renderOptions}
            onResumeChange={setResume}
            onRenderOptionsChange={setRenderOptions}
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
        </div>

        <div className="min-h-0 min-w-0 overflow-hidden">
          <ResumePreview
            compileError={compileError}
            pdfUrl={pdfUrl}
            previewStale={previewStale}
          />
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
