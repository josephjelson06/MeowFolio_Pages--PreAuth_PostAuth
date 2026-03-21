import { atsMock } from "../../data/analysis";
import { MetricRing } from "../ui/MetricRing";
import { Panel } from "../ui/Panel";

const toneAccent = {
  primary: "bg-primary-fixed text-on-primary-fixed-variant border-primary",
  secondary: "bg-secondary-fixed text-on-secondary-fixed-variant border-secondary",
  tertiary: "bg-tertiary-fixed text-on-tertiary-fixed-variant border-tertiary",
  surface: "bg-surface-container-lowest text-on-surface border-outline-variant"
} as const;

export function AtsReportPanel() {
  return (
    <Panel className="h-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-primary">Analysis Workspace</p>
          <h2 className="mt-2 font-headline text-3xl font-extrabold text-on-surface">ATS Scorer</h2>
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
          </div>
          <MetricRing accentColor="#9d4223" caption={atsMock.rating} label="Score" score={atsMock.score} size={150} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {atsMock.categories.map((category) => (
            <div
              key={category.label}
              className={`rounded-[1.5rem] border-b-4 p-5 shadow-sm ${toneAccent[category.tone]}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">{category.label}</p>
              <p className="mt-2 font-headline text-2xl font-extrabold">{category.value}/100</p>
            </div>
          ))}
        </div>

        <div>
          <h4 className="font-headline text-2xl font-bold text-on-surface">What to Fix</h4>
          <div className="mt-4 space-y-4">
            {atsMock.issues.map((issue) => (
              <div
                key={issue.title}
                className="rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest p-5"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={
                      issue.severity === "Critical"
                        ? "rounded-full bg-error-container px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-on-error-container"
                        : "rounded-full bg-primary-fixed px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-on-primary-fixed-variant"
                    }
                  >
                    {issue.severity}
                  </span>
                  <h5 className="font-headline text-lg font-bold text-on-surface">{issue.title}</h5>
                </div>
                <p className="mt-3 text-sm leading-6 text-on-surface-variant">{issue.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
