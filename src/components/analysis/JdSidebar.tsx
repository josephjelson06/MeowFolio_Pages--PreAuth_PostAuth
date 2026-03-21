import { Panel } from "../ui/Panel";
import { SectionHeading } from "../ui/SectionHeading";

export function JdSidebar() {
  return (
    <Panel className="h-full">
      <SectionHeading
        eyebrow="Preparation"
        title="Select Resume"
        description="The left rail stays narrow and utility-focused, just like the current analyzer layout."
      />
      <div className="mt-6 rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest p-4">
        <div className="resume-paper rounded-[1.25rem] p-5">
          <div className="space-y-4 rounded-[1rem] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-fixed" />
              <div className="space-y-2">
                <div className="h-2 w-28 rounded-full bg-outline-variant/40" />
                <div className="h-2 w-20 rounded-full bg-outline-variant/30" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full rounded-full bg-outline-variant/25" />
              <div className="h-2 w-5/6 rounded-full bg-outline-variant/25" />
              <div className="h-2 w-3/4 rounded-full bg-outline-variant/25" />
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full rounded-full bg-outline-variant/25" />
              <div className="h-2 w-4/5 rounded-full bg-outline-variant/25" />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 px-2">
          <div>
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Active Resume</p>
            <p className="font-bold text-on-surface">Product_Designer_Senior_2024.pdf</p>
          </div>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container">
            <span className="material-symbols-outlined text-on-surface-variant">swap_horiz</span>
          </button>
        </div>
      </div>
    </Panel>
  );
}
