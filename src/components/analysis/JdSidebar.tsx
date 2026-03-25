import type { AnalysisResumeOption } from "../../data/analysis-resumes";
import { ResumeSelectorPanel } from "./ResumeSelectorPanel";

interface JdSidebarProps {
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  resumes: AnalysisResumeOption[];
}

export function JdSidebar({ currentIndex, onNext, onPrevious, resumes }: JdSidebarProps) {
  return (
    <ResumeSelectorPanel
      currentIndex={currentIndex}
      onNext={onNext}
      onPrevious={onPrevious}
      resumes={resumes}
      title="Select Resume"
      description="Choose which resume version should be matched against the job description. The left panel stays fixed while the right panel changes state."
    />
  );
}
