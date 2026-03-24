import type { JdAnalysisResult } from "../../types/analysis";
import { Chip } from "../ui/Chip";
import { MetricRing } from "../ui/MetricRing";
import { Panel } from "../ui/Panel";

interface JdReportPanelProps {
  analysis: JdAnalysisResult;
  hasJobDescription: boolean;
}

function formatSectionLabel(value: string | null) {
  if (!value) {
    return "Resume";
  }

  return `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
}

export function JdReportPanel({ analysis, hasJobDescription }: JdReportPanelProps) {
  const matchedEvidence = analysis.keywordBreakdown.filter((item) => item.status === "matched").slice(0, 4);
  const keywordBreakdown = analysis.keywordBreakdown.slice(0, 10);

  return (
    <Panel className="h-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-primary">Analysis Workspace</p>
          <h2 className="mt-2 font-headline text-3xl font-extrabold text-on-surface">JD Analyzer</h2>
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

      <div className="mt-8 grid gap-6 xl:grid-cols-12">
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
                <p className="text-sm text-on-surface-variant">
                  {hasJobDescription
                    ? "No strong keyword matches yet. Tighten the resume language against the JD."
                    : "Add a job description to start the match analysis."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
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
                <p className="text-sm leading-6 text-on-surface-variant">
                  {hasJobDescription
                    ? "No matched evidence surfaced yet. Tighten your summary, skills, and experience language around the job description."
                    : "Add a job description to start surfacing matched evidence."}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6">
          <h3 className="font-headline text-2xl font-bold text-on-surface">Keyword Breakdown</h3>
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
                      : "No direct evidence surfaced in the current resume."}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] bg-surface-container-low p-5">
                <p className="text-sm leading-6 text-on-surface-variant">
                  {hasJobDescription ? "No keyword breakdown is available yet." : "Paste a JD to extract keywords and section evidence."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6">
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
              <p className="text-sm leading-6 text-on-surface-variant">
                {hasJobDescription
                  ? "No missing keywords surfaced from this local pass."
                  : "Paste a JD to surface missing or partial keywords from the target role."}
              </p>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
