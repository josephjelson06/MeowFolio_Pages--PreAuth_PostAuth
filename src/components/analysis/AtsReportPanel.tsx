import type { AtsAnalysisResult } from "../../types/analysis";
import type { ResumeData } from "../../types/resume";
import { flattenSkills } from "../../lib/resume";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { MetricRing } from "../ui/MetricRing";
import { Panel } from "../ui/Panel";

function formatSectionLabel(value: string) {
  return value === "header" ? "Header" : `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
}

interface AtsReportPanelProps {
  analysis: AtsAnalysisResult;
  hasRun: boolean;
  onRun: () => void;
  resume: ResumeData;
}

export function AtsReportPanel({ analysis, hasRun, onRun, resume }: AtsReportPanelProps) {
  const skillsCount = flattenSkills(resume.skills).length;

  return (
    <Panel className="flex h-full min-h-0 flex-col p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-primary">Analysis Workspace</p>
          <h2 className="mt-2 font-headline text-3xl font-extrabold text-on-surface">ATS Scorer</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
            Select a resume from the left panel, then run the ATS scan. The right side stays focused on the action or the result only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip tone="soft">{resume.experience.length} experience</Chip>
          <Chip tone="soft">{skillsCount} skills</Chip>
        </div>
      </div>

      {!hasRun ? (
        <div className="mt-8 flex min-h-0 flex-1 items-center justify-center">
          <div className="mx-auto flex max-w-xl flex-col items-center rounded-[1.9rem] bg-surface-container-lowest px-10 py-12 text-center">
            <div className="flex h-48 w-48 items-center justify-center rounded-full bg-surface-container-high shadow-inner">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-ambient">
                <span className="material-symbols-outlined text-5xl text-primary">analytics</span>
              </div>
            </div>
            <h3 className="mt-8 font-headline text-4xl font-extrabold text-on-surface">Ready for your ATS scan?</h3>
            <p className="mt-4 max-w-md text-lg leading-8 text-on-surface-variant">
              Keep the selected resume on the left and run one focused ATS pass for that version.
            </p>
            <div className="mt-8">
              <Button icon="analytics" size="lg" onClick={onRun}>
                Run ATS Scan
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="workspace-scroll mt-8 flex-1 min-h-0 overflow-y-auto pr-2">
          <div className="space-y-8">
            <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">Summary Report</p>
                <h3 className="mt-2 font-headline text-4xl font-extrabold text-on-surface">ATS Score Report</h3>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-on-surface-variant">{analysis.summary}</p>
              </div>
              <MetricRing accentColor="var(--color-primary)" caption={analysis.rating} label="Score" score={analysis.score} size={150} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {analysis.categories.map((category) => (
                <div
                  key={category.label}
                  className="rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest p-5"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">{category.label}</p>
                  <p className="mt-2 font-headline text-2xl font-extrabold text-on-surface">{category.value}/100</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Render Checks</p>
                    <h4 className="mt-2 font-headline text-2xl font-bold text-on-surface">Formatting Snapshot</h4>
                  </div>
                  <Chip tone={analysis.renderChecks.every((check) => check.passed) ? "mint" : "lavender"}>
                    {analysis.renderChecks.filter((check) => check.passed).length}/{analysis.renderChecks.length} pass
                  </Chip>
                </div>
                <div className="mt-5 space-y-4">
                  {analysis.renderChecks.map((check) => (
                    <div key={check.label} className="rounded-[1.5rem] bg-surface-container-low p-4">
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined ${check.passed ? "text-tertiary" : "text-error"}`}>
                          {check.passed ? "check_circle" : "warning"}
                        </span>
                        <p className="font-semibold text-on-surface">{check.label}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{check.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6">
                <div>
                  <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Section Signals</p>
                  <h4 className="mt-2 font-headline text-2xl font-bold text-on-surface">Coverage Snapshot</h4>
                </div>
                <div className="mt-5 space-y-4">
                  {analysis.sectionSignals.map((signal) => (
                    <div key={signal.section} className="rounded-[1.5rem] bg-surface-container-low p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-on-surface">{formatSectionLabel(signal.section)}</p>
                        <Chip tone={signal.status === "strong" ? "mint" : "lavender"}>
                          {signal.status === "strong" ? "Strong" : "Needs Work"}
                        </Chip>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{signal.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6">
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-headline text-2xl font-bold text-on-surface">What to Fix</h4>
                <Button icon="refresh" variant="surface" onClick={onRun}>
                  Run Again
                </Button>
              </div>
              <div className="mt-5 space-y-4">
                {analysis.issues.length > 0 ? (
                  analysis.issues.map((issue) => (
                    <div key={issue.title} className="rounded-[1.5rem] bg-surface-container-low p-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <Chip tone={issue.severity === "Low" ? "soft" : issue.severity === "Moderate" ? "lavender" : "coral"}>
                          {issue.severity}
                        </Chip>
                        <h5 className="font-headline text-lg font-bold text-on-surface">{issue.title}</h5>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-on-surface-variant">{issue.detail}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] bg-surface-container-low p-5">
                    <p className="font-headline text-lg font-bold text-on-surface">No urgent ATS issues detected</p>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                      The selected resume looks structurally healthy for this local ATS pass.
                    </p>
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
