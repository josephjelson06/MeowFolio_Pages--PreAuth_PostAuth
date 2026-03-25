import { useRef, useState, type ChangeEvent } from "react";
import type { JdAnalysisResult } from "../../types/analysis";
import { requestExtractedTextFile } from "../../lib/import-client";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { MetricRing } from "../ui/MetricRing";
import { Panel } from "../ui/Panel";

interface JdReportPanelProps {
  analysis: JdAnalysisResult;
  hasJobDescription: boolean;
  hasRun: boolean;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  onRun: () => void;
}

function formatSectionLabel(value: string | null) {
  if (!value) {
    return "Resume";
  }

  return `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
}

const textareaClassName =
  "min-h-[240px] w-full resize-y rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-highest px-5 py-4 text-sm leading-7 text-on-surface outline-none transition focus:border-primary/40 focus:bg-white";

export function JdReportPanel({
  analysis,
  hasJobDescription,
  hasRun,
  jobDescription,
  onJobDescriptionChange,
  onRun
}: JdReportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const matchedEvidence = analysis.keywordBreakdown.filter((item) => item.status === "matched").slice(0, 4);
  const keywordBreakdown = analysis.keywordBreakdown.slice(0, 10);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadState("loading");
    setUploadMessage(`Reading ${file.name}...`);

    try {
      const response = await requestExtractedTextFile(file);
      onJobDescriptionChange(response.extractedText);
      setUploadState("success");
      setUploadMessage(`${response.fileName} loaded into the JD input.`);
    } catch (error) {
      setUploadState("error");
      setUploadMessage(error instanceof Error ? error.message : "Failed to upload job description.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <Panel className="flex h-full min-h-0 flex-col p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-primary">Analysis Workspace</p>
          <h2 className="mt-2 font-headline text-3xl font-extrabold text-on-surface">JD Analyzer</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
            Keep the resume locked on the left. On this side, paste or upload the target JD first, then review the match result.
          </p>
        </div>
      </div>

      {!hasRun ? (
        <div className="workspace-scroll mt-8 flex-1 min-h-0 overflow-y-auto pr-2">
          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6">
              <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Paste Job Description</p>
              <textarea
                className={`${textareaClassName} mt-4`}
                value={jobDescription}
                onChange={(event) => onJobDescriptionChange(event.target.value)}
                placeholder="Paste the target role requirements here..."
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-outline-variant/20" />
              <span className="font-label text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">or</span>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>

            <div className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6">
              <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Upload Job Description</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 flex w-full flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-outline-variant/25 bg-surface-container-highest px-6 py-10 text-center transition hover:border-primary/40 hover:bg-white"
              >
                <span className="material-symbols-outlined text-4xl text-primary">upload_file</span>
                <p className="mt-4 font-headline text-xl font-bold text-on-surface">Drag or upload a JD file</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">Supports TXT, MD, PDF, and DOCX files.</p>
              </button>
              {uploadMessage ? (
                <div
                  className={`mt-4 rounded-[1.25rem] px-4 py-3 text-sm ${
                    uploadState === "error"
                      ? "bg-error-container/40 text-on-surface"
                      : "bg-surface-container-high text-on-surface"
                  }`}
                >
                  {uploadMessage}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end">
              <Button icon="query_stats" size="lg" onClick={onRun} disabled={!hasJobDescription}>
                Run JD Analysis
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="workspace-scroll mt-8 flex-1 min-h-0 overflow-y-auto pr-2">
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-12">
              <div className="rounded-[1.75rem] bg-surface-container-lowest p-8 xl:col-span-5">
                <div className="flex justify-center">
                  <MetricRing accentColor="var(--color-coral)" label="Match Score" score={analysis.score} size={168} />
                </div>
                <div className="mt-6 text-center">
                  <h3 className="font-headline text-xl font-bold text-on-surface">{analysis.summaryTitle}</h3>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">{analysis.summaryCopy}</p>
                </div>
              </div>

              <div className="space-y-4 xl:col-span-7">
                <div className="rounded-[1.75rem] border border-outline-variant/20 bg-tertiary-fixed p-6">
                  <p className="font-label text-sm font-bold text-on-tertiary-fixed-variant">Matched Keywords</p>
                  <p className="mt-2 font-headline text-4xl font-black text-on-tertiary-fixed">{analysis.matched}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.75rem] bg-error-container p-6 text-on-error-container">
                    <p className="font-label text-sm font-bold uppercase tracking-[0.18em] opacity-80">Missing</p>
                    <p className="mt-2 font-headline text-3xl font-black">{analysis.missing}</p>
                  </div>
                  <div className="rounded-[1.75rem] bg-secondary-container p-6 text-on-secondary-container">
                    <p className="font-label text-sm font-bold uppercase tracking-[0.18em] opacity-80">Partial</p>
                    <p className="mt-2 font-headline text-3xl font-black">{analysis.partial}</p>
                  </div>
                </div>
                <div className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6">
                  <p className="font-label text-sm font-bold uppercase tracking-[0.18em] text-on-surface-variant">Matched Terms</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {analysis.tags.length > 0 ? (
                      analysis.tags.map((tag, index) => (
                        <Chip key={tag} tone={index === 0 ? "mint" : index === 1 ? "lavender" : "soft"}>
                          {tag}
                        </Chip>
                      ))
                    ) : (
                      <p className="text-sm text-on-surface-variant">No strong keyword matches surfaced from this pass yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6">
                <h3 className="font-headline text-2xl font-bold text-on-surface">Matched Evidence</h3>
                <div className="mt-5 space-y-4">
                  {matchedEvidence.length > 0 ? (
                    matchedEvidence.map((item) => (
                      <div key={`${item.keyword}-${item.section}`} className="rounded-[1.5rem] bg-surface-container-low p-5">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="font-headline text-lg font-bold text-on-surface">{item.keyword}</h4>
                          <Chip tone="mint">{formatSectionLabel(item.section)}</Chip>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-on-surface-variant">{item.evidence ?? "Matched in the resume."}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.5rem] bg-surface-container-low p-5">
                      <p className="text-sm leading-6 text-on-surface-variant">No matched evidence surfaced yet from this selected resume and JD pair.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-headline text-2xl font-bold text-on-surface">Keyword Breakdown</h3>
                  <Button icon="refresh" variant="surface" onClick={onRun}>
                    Run Again
                  </Button>
                </div>
                <div className="mt-5 space-y-3">
                  {keywordBreakdown.length > 0 ? (
                    keywordBreakdown.map((item) => (
                      <div key={`${item.keyword}-${item.status}`} className="rounded-[1.5rem] bg-surface-container-low p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-on-surface">{item.keyword}</p>
                          <Chip tone={item.status === "matched" ? "mint" : item.status === "partial" ? "lavender" : "soft"}>
                            {item.status}
                          </Chip>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                          {item.section
                            ? `Closest evidence sits in ${formatSectionLabel(item.section)}.`
                            : "No direct evidence surfaced in the selected resume."}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.5rem] bg-surface-container-low p-5">
                      <p className="text-sm leading-6 text-on-surface-variant">No keyword breakdown is available yet for this analysis.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6">
              <h3 className="font-headline text-2xl font-bold text-on-surface">Missing Keywords</h3>
              <div className="mt-5 space-y-4">
                {analysis.suggestions.length > 0 ? (
                  analysis.suggestions.map((suggestion, index) => (
                    <div key={suggestion.keyword} className="rounded-[1.5rem] bg-surface-container-low p-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={
                            index % 2 === 0
                              ? "flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-primary"
                              : "flex h-10 w-10 items-center justify-center rounded-full bg-secondary-fixed text-secondary"
                          }
                        >
                          <span className="material-symbols-outlined">{suggestion.status === "missing" ? "leaderboard" : "tune"}</span>
                        </div>
                        <div>
                          <h4 className="font-headline text-lg font-bold text-on-surface">{suggestion.keyword}</h4>
                          <p className="text-sm text-on-surface-variant">{suggestion.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] bg-surface-container-low p-5">
                    <p className="text-sm leading-6 text-on-surface-variant">No missing keywords surfaced from this selected JD pass.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}
