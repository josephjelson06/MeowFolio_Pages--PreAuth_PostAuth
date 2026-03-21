import { atsMock } from "../../data/analysis";
import { Panel } from "../ui/Panel";
import { SectionHeading } from "../ui/SectionHeading";

export function AtsSidebar() {
  return (
    <Panel className="h-full">
      <SectionHeading eyebrow="Preparation" title="Select Resume" description="Static resume selector preserved as a left utility rail." />
      <div className="mt-6 rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest p-4">
        <div className="resume-paper flex w-full items-center justify-center rounded-[1.25rem] bg-white p-6">
          <div className="soft-grid h-full w-full rounded-[1rem] p-5">
            <div className="h-3 w-2/3 rounded-full bg-outline-variant/50" />
            <div className="mt-4 space-y-2">
              <div className="h-2 w-full rounded-full bg-outline-variant/30" />
              <div className="h-2 w-5/6 rounded-full bg-outline-variant/30" />
              <div className="h-2 w-3/4 rounded-full bg-outline-variant/30" />
            </div>
            <div className="mt-5 space-y-2">
              <div className="h-2 w-full rounded-full bg-outline-variant/30" />
              <div className="h-2 w-11/12 rounded-full bg-outline-variant/30" />
              <div className="h-2 w-4/5 rounded-full bg-outline-variant/30" />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 px-2">
          <div>
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Active Resume</p>
            <p className="font-bold text-on-surface">Senior_Product_Designer.pdf</p>
          </div>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container">
            <span className="material-symbols-outlined text-on-surface-variant">swap_horiz</span>
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
          ATS Formatting Rules
        </p>
        {atsMock.rules.map((rule) => (
          <div key={rule} className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-4 py-3">
            <span className="material-symbols-outlined text-tertiary">check_circle</span>
            <span className="text-sm font-medium text-on-surface">{rule}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
