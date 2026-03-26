import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import { createEmptyResumeData, type RenderOptions, type ResumeData } from "../../types/resume";
import { createDefaultWorkspaceSnapshot, loadWorkspaceSnapshot, saveWorkspaceSnapshot } from "./storage";

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
  const [workspace, setWorkspace] = useState(() => loadWorkspaceSnapshot());

  useEffect(() => {
    saveWorkspaceSnapshot(workspace);
  }, [workspace]);

  function setResume(value: ResumeData) {
    setWorkspace((current) => ({
      ...current,
      resume: stampResume(value)
    }));
  }

  function setRenderOptions(value: RenderOptions) {
    setWorkspace((current) => ({
      ...current,
      renderOptions: {
        ...value,
        sectionOrder: [...value.sectionOrder],
        sectionTitles: { ...value.sectionTitles }
      }
    }));
  }

  function setJobDescription(value: string) {
    setWorkspace((current) => ({
      ...current,
      jobDescription: value
    }));
  }

  function loadSampleResume() {
    setWorkspace((current) => {
      const fallback = createDefaultWorkspaceSnapshot();

      return {
        ...current,
        resume: fallback.resume
      };
    });
  }

  function clearResume() {
    setWorkspace((current) => ({
      ...current,
      resume: createEmptyResumeData("scratch")
    }));
  }

  return (
    <WorkspaceContext.Provider
      value={{
        clearResume,
        jobDescription: workspace.jobDescription,
        loadSampleResume,
        renderOptions: workspace.renderOptions,
        resume: workspace.resume,
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
