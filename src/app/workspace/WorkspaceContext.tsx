import {
  createContext,
  useContext,
  useState,
  type ReactNode
} from "react";
import { sampleJobDescription } from "../../data/analysis";
import { createMockResumeData } from "../../data/editor";
import { createInitialRenderOptions } from "../../lib/tex";
import { createEmptyResumeData, type RenderOptions, type ResumeData } from "../../types/resume";

interface WorkspaceContextValue {
  clearResume: () => void;
  jobDescription: string;
  loadSampleResume: () => void;
  renderOptions: RenderOptions;
  resume: ResumeData;
  setJobDescription: (value: string) => void;
  setRenderOptions: (value: RenderOptions) => void;
  setResume: (value: ResumeData) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function stampResume(next: ResumeData) {
  return {
    ...next,
    meta: {
      ...next.meta,
      updatedAt: new Date().toISOString()
    }
  };
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [resume, setResumeState] = useState<ResumeData>(() => createMockResumeData());
  const [renderOptions, setRenderOptions] = useState<RenderOptions>(() => createInitialRenderOptions());
  const [jobDescription, setJobDescription] = useState(sampleJobDescription);

  function setResume(value: ResumeData) {
    setResumeState(stampResume(value));
  }

  function loadSampleResume() {
    setResumeState(createMockResumeData());
  }

  function clearResume() {
    setResumeState(createEmptyResumeData("scratch"));
  }

  return (
    <WorkspaceContext.Provider
      value={{
        clearResume,
        jobDescription,
        loadSampleResume,
        renderOptions,
        resume,
        setJobDescription,
        setRenderOptions,
        setResume
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider.");
  }

  return context;
}
