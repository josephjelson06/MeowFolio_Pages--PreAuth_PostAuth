import { jdMock } from "../../data/analysis";
import { Chip } from "../ui/Chip";
import { MetricRing } from "../ui/MetricRing";
import { Panel } from "../ui/Panel";

export function JdReportPanel() {
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
            <MetricRing accentColor="#f4845f" label="Match Score" score={jdMock.score} size={168} />
          </div>
          <div className="mt-6 text-center">
            <h3 className="font-headline text-xl font-bold text-on-surface">{jdMock.summaryTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{jdMock.summaryCopy}</p>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-7">
          <div className="rounded-[1.75rem] border border-outline-variant/20 bg-tertiary-fixed p-6">
            <p className="font-label text-sm font-bold text-on-tertiary-fixed-variant">Matched Keywords</p>
            <p className="mt-2 font-headline text-4xl font-black text-on-tertiary-fixed">{jdMock.matched}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.75rem] bg-error-container p-6 text-on-error-container">
              <p className="font-label text-sm font-bold uppercase tracking-[0.18em] opacity-80">Missing</p>
              <p className="mt-2 font-headline text-3xl font-black">{jdMock.missing}</p>
            </div>
            <div className="rounded-[1.75rem] bg-secondary-container p-6 text-on-secondary-container">
              <p className="font-label text-sm font-bold uppercase tracking-[0.18em] opacity-80">Partial</p>
              <p className="mt-2 font-headline text-3xl font-black">{jdMock.partial}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6">
        <h3 className="font-headline text-2xl font-bold text-on-surface">Missing Keywords</h3>
        <div className="mt-5 space-y-4">
          {jdMock.suggestions.map((suggestion, index) => (
            <div key={suggestion.keyword} className="rounded-[1.5rem] bg-surface-container-low p-5">
              <div className="flex items-center gap-3">
                <div
                  className={
                    index % 2 === 0
                      ? "flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-primary"
                      : "flex h-10 w-10 items-center justify-center rounded-full bg-secondary-fixed text-secondary"
                  }
                >
                  <span className="material-symbols-outlined">{index % 2 === 0 ? "leaderboard" : "brush"}</span>
                </div>
                <div>
                  <h4 className="font-headline text-lg font-bold text-on-surface">{suggestion.keyword}</h4>
                  <p className="text-sm text-on-surface-variant">{suggestion.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {jdMock.tags.map((tag, index) => (
            <Chip key={tag} tone={index === 0 ? "mint" : index === 1 ? "lavender" : "soft"}>
              {tag}
            </Chip>
          ))}
        </div>
      </div>
    </Panel>
  );
}
