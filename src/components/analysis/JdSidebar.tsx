import type { ChangeEvent } from "react";
import type { JdAnalysisResult } from "../../types/analysis";
import type { ResumeData } from "../../types/resume";
import { sampleJobDescription } from "../../data/analysis";
import { Chip } from "../ui/Chip";
import { Panel } from "../ui/Panel";
import { SectionHeading } from "../ui/SectionHeading";
import { ResumeImportCard } from "./ResumeImportCard";

interface JdSidebarProps {
  analysis: JdAnalysisResult;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  onResumeChange: (resume: ResumeData) => void;
  resume: ResumeData;
}

const textareaClassName =
  "min-h-[220px] w-full resize-y rounded-2xl border border-outline-variant/20 bg-surface-container-highest px-4 py-3 text-sm leading-6 text-on-surface outline-none transition focus:border-primary/40 focus:bg-white";

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="ml-1 block font-label text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
      {children}
    </span>
  );
}

function IconButton({
  icon,
  label,
  onClick
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-lowest px-4 text-sm font-bold text-on-surface transition hover:-translate-y-px"
    >
      <span className="inline-flex items-center gap-2">
        <span className="material-symbols-outlined text-lg">{icon}</span>
        {label}
      </span>
    </button>
  );
}

export function JdSidebar({
  analysis,
  jobDescription,
  onJobDescriptionChange,
  onResumeChange,
  resume
}: JdSidebarProps) {
  return (
    <Panel className="h-full">
      <SectionHeading
        eyebrow="Preparation"
        title="Resume + JD Input"
        description="Import a resume, paste the target job description, and keep both inputs visible in the left rail while the match report updates on the right."
      />

      <div className="mt-6">
        <ResumeImportCard resume={resume} onResumeChange={onResumeChange} />
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest p-4">
        <label className="space-y-2">
          <FieldLabel>Job Description</FieldLabel>
          <textarea
            className={textareaClassName}
            value={jobDescription}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onJobDescriptionChange(event.target.value)}
            placeholder="Paste the target job description here."
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-3">
          <IconButton icon="description" label="Load sample JD" onClick={() => onJobDescriptionChange(sampleJobDescription)} />
          <IconButton icon="close" label="Clear JD" onClick={() => onJobDescriptionChange("")} />
        </div>

        <div className="mt-5">
          <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Detected Keywords</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {analysis.keywords.length > 0 ? (
              analysis.keywords.slice(0, 8).map((keyword, index) => (
                <Chip key={keyword} tone={index < 2 ? "mint" : index < 4 ? "lavender" : "soft"}>
                  {keyword}
                </Chip>
              ))
            ) : (
              <p className="text-sm text-on-surface-variant">Add a JD to extract the target language and missing keywords.</p>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
