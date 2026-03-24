import type { AtsAnalysisResult } from "../../types/analysis";
import type { ResumeData } from "../../types/resume";
import { Panel } from "../ui/Panel";
import { SectionHeading } from "../ui/SectionHeading";
import { ResumeImportCard } from "./ResumeImportCard";

interface AtsSidebarProps {
  analysis: AtsAnalysisResult;
  onResumeChange: (resume: ResumeData) => void;
  resume: ResumeData;
}

export function AtsSidebar({ analysis, onResumeChange, resume }: AtsSidebarProps) {
  return (
    <Panel className="h-full">
      <SectionHeading
        eyebrow="Preparation"
        title="Resume Input"
        description="Import resume text or a file, then review ATS-focused checks and deterministic scoring from the same canonical schema."
      />

      <div className="mt-6">
        <ResumeImportCard resume={resume} onResumeChange={onResumeChange} />
      </div>

      <div className="mt-6 space-y-3">
        <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">ATS Checks</p>
        {analysis.rules.map((rule) => (
          <div key={rule.label} className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-4 py-3">
            <span className={`material-symbols-outlined ${rule.passed ? "text-tertiary" : "text-error"}`}>
              {rule.passed ? "check_circle" : "warning"}
            </span>
            <span className="text-sm font-medium text-on-surface">{rule.label}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
