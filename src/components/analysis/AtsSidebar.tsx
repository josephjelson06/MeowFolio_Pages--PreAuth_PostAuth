import type { AnalysisResumeOption } from "../../data/analysis-resumes";
import { ResumeSelectorPanel } from "./ResumeSelectorPanel";

interface AtsSidebarProps {
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  resumes: AnalysisResumeOption[];
}

export function AtsSidebar({ currentIndex, onNext, onPrevious, resumes }: AtsSidebarProps) {
  return (
    <ResumeSelectorPanel
      currentIndex={currentIndex}
      onNext={onNext}
      onPrevious={onPrevious}
      resumes={resumes}
      title="Select Resume"
      description="Pick the resume version you want to scan. The same selector stays in place before and after the ATS run."
    />
  );
}
