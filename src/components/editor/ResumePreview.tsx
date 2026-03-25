import { useEffect, useMemo, useRef, useState } from "react";
import { fetchCompilerHealth, requestCompiledPdf } from "../../lib/render-client";
import type { RenderOptions, ResumeData } from "../../types/resume";
import type { CompilerHealthResponse } from "../../types/render";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { Panel } from "../ui/Panel";

interface ResumePreviewProps {
  renderOptions: RenderOptions;
  resume: ResumeData;
}

type CompileState = "error" | "idle" | "success" | "compiling";

function StatusBanner({
  health,
  message,
  previewStale,
  state
}: {
  health: CompilerHealthResponse | null;
  message: string | null;
  previewStale: boolean;
  state: CompileState;
}) {
  const toneClassName =
    state === "error" || health?.engineAvailable === false
      ? "border-error-container bg-error-container/40 text-on-surface"
      : "border-outline-variant/20 bg-surface-container-lowest text-on-surface";

  return (
    <div className={`rounded-[1.5rem] border px-5 py-4 ${toneClassName}`}>
      <div className="flex flex-wrap items-center gap-3">
        <Chip tone={health?.engineAvailable ? "mint" : "coral"}>
          {health?.engineAvailable ? "Compiler Ready" : "Compiler Missing"}
        </Chip>
        {state === "success" ? <Chip tone="lavender">PDF Ready</Chip> : null}
        {state === "compiling" ? <Chip tone="soft">Rendering</Chip> : null}
        {previewStale ? <Chip tone="soft">Changes Pending</Chip> : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-on-surface">
        {message
          ? message
          : !health?.engineAvailable
            ? "No TeX engine is available, so the rendered PDF cannot appear here yet."
            : state === "compiling"
              ? `Rendering the latest resume with ${health.engineCommand}.`
              : previewStale
                ? "Your latest edits are not in the PDF yet. Press Compile / Render to refresh this preview."
                : "The PDF preview stays visually stable and only refreshes after a compile action."}
      </p>
    </div>
  );
}

function EmptyPanel({
  copy,
  title
}: {
  copy: string;
  title: string;
}) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center rounded-[1.75rem] border border-dashed border-outline-variant/30 bg-surface-container-lowest p-8 text-center">
      <div className="max-w-md">
        <p className="font-headline text-2xl font-bold text-on-surface">{title}</p>
        <p className="mt-3 text-sm leading-6 text-on-surface-variant">{copy}</p>
      </div>
    </div>
  );
}

export function ResumePreview({ renderOptions, resume }: ResumePreviewProps) {
  const [compilerHealth, setCompilerHealth] = useState<CompilerHealthResponse | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [compileState, setCompileState] = useState<CompileState>("idle");
  const [lastCompiledFingerprint, setLastCompiledFingerprint] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const compileRunRef = useRef(0);
  const compileFingerprint = useMemo(() => JSON.stringify({ renderOptions, resume }), [renderOptions, resume]);
  const previewStale = lastCompiledFingerprint !== null && lastCompiledFingerprint !== compileFingerprint;

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

  function downloadPdf() {
    if (!pdfUrl) {
      return;
    }

    const link = document.createElement("a");

    link.href = pdfUrl;
    link.download = `${resume.header.name?.trim() || "resume"}.pdf`;
    link.click();
  }

  return (
    <Panel className="flex h-full min-h-0 flex-col p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-primary">Rendered View</p>
          <h2 className="mt-2 font-headline text-3xl font-extrabold text-on-surface">PDF Output</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="soft">{renderOptions.templateId}</Chip>
          <Chip tone="soft">{renderOptions.pageLimit} page</Chip>
          <Chip tone="mint">{renderOptions.margin} margin</Chip>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap justify-end gap-3">
        <Button icon="download" variant="surface" onClick={downloadPdf} disabled={!pdfUrl}>
          Download PDF
        </Button>
        <Button
          icon="picture_as_pdf"
          onClick={handleCompile}
          disabled={compileState === "compiling" || !compilerHealth?.engineAvailable}
        >
          {compileState === "compiling" ? "Rendering..." : pdfUrl ? "Compile / Render" : "Compile First PDF"}
        </Button>
      </div>

      <StatusBanner health={compilerHealth} message={compileError} previewStale={previewStale} state={compileState} />

      <div className="mt-6 flex-1 min-h-0 overflow-hidden">
        {pdfUrl ? (
          <div className="h-full overflow-hidden rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest">
            <iframe title="Compiled resume PDF" src={pdfUrl} className="h-full w-full bg-white" />
          </div>
        ) : (
          <EmptyPanel
            title={compilerHealth?.engineAvailable ? "Compile The PDF Preview" : "PDF Viewer Unavailable"}
            copy={
              compilerHealth?.engineAvailable
                ? "The right pane stays stable until you press Compile / Render. Your compiled PDF will appear here."
                : "Install and run the TeX compiler service to render the PDF in this pane."
            }
          />
        )}
      </div>
    </Panel>
  );
}
