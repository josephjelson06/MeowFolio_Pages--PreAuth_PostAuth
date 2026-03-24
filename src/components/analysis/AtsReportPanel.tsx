import type { AtsAnalysisResult } from "../../types/analysis";
import type { ResumeData } from "../../types/resume";
import { flattenSkills } from "../../lib/resume";
import { Chip } from "../ui/Chip";
import { MetricRing } from "../ui/MetricRing";
import { Panel } from "../ui/Panel";

const toneAccent = {
  primary: "bg-primary-fixed text-on-primary-fixed-variant border-primary",
  secondary: "bg-secondary-fixed text-on-secondary-fixed-variant border-secondary",
  tertiary: "bg-tertiary-fixed text-on-tertiary-fixed-variant border-tertiary",
  surface: "bg-surface-container-lowest text-on-surface border-outline-variant"
} as const;

function formatSectionLabel(value: string) {
  return value === "header" ? "Header" : `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
}

interface AtsReportPanelProps {
  analysis: AtsAnalysisResult;
  resume: ResumeData;
}

export function AtsReportPanel({ analysis, resume }: AtsReportPanelProps) {
  const skillsCount = flattenSkills(resume.skills).length;

  return (
    <Panel className="h-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-primary">Analysis Workspace</p>
          <h2 className="mt-2 font-headline text-3xl font-extrabold text-on-surface">ATS Scorer</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">{analysis.summary}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-high p-1.5">
          <button type="button" className="rounded-full bg-surface-container-lowest px-5 py-2 text-sm font-bold text-on-surface-variant">
            Input
          </button>
          <button type="button" className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-on-primary">
            Report
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">Summary Report</p>
            <h3 className="mt-2 font-headline text-4xl font-extrabold text-on-surface">ATS Score Report</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-surface-container-high px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface">
                {resume.experience.length} experience entries
              </span>
              <span className="rounded-full bg-surface-container-high px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface">
                {skillsCount} skills
              </span>
            </div>
          </div>
          <MetricRing accentColor="var(--color-primary)" caption={analysis.rating} label="Score" score={analysis.score} size={150} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {analysis.categories.map((category) => (
            <div
              key={category.label}
              className={`rounded-[1.5rem] border-b-4 p-5 shadow-sm ${toneAccent[category.tone]}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">{category.label}</p>
              <p className="mt-2 font-headline text-2xl font-extrabold">{category.value}/100</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Render Checks</p>
                <h4 className="mt-2 font-headline text-2xl font-bold text-on-surface">PDF Output Health</h4>
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

        <div>
          <h4 className="font-headline text-2xl font-bold text-on-surface">What to Fix</h4>
          <div className="mt-4 space-y-4">
            {analysis.issues.length > 0 ? (
              analysis.issues.map((issue) => (
                <div
                  key={issue.title}
                  className="rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest p-5"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={
                        issue.severity === "Critical"
                          ? "rounded-full bg-error-container px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-on-error-container"
                          : issue.severity === "Moderate"
                            ? "rounded-full bg-primary-fixed px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-on-primary-fixed-variant"
                            : "rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface"
                      }
                    >
                      {issue.severity}
                    </span>
                    <h5 className="font-headline text-lg font-bold text-on-surface">{issue.title}</h5>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-on-surface-variant">{issue.detail}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest p-5">
                <p className="font-headline text-lg font-bold text-on-surface">No urgent ATS issues detected</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  The imported resume looks structurally healthy for a local deterministic pass. Keep refining language and quantified impact.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
