import { useRef, useState, type ChangeEvent } from "react";
import type { ResumeImportResult } from "../../types/import";
import type { ResumeData, ResumeSectionKey } from "../../types/resume";
import { createMockResumeData } from "../../data/editor";
import { requestImportedResumeFile } from "../../lib/import-client";
import { importResumeFromText } from "../../lib/resume-import";
import { flattenSkills } from "../../lib/resume";
import { Chip } from "../ui/Chip";

interface ResumeImportCardProps {
  onResumeChange: (resume: ResumeData) => void;
  resume: ResumeData;
}

const fieldClassName =
  "w-full rounded-2xl border border-outline-variant/20 bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary/40 focus:bg-white";

const sectionLabels: Record<ResumeSectionKey, string> = {
  summary: "Summary",
  skills: "Skills",
  education: "Education",
  experience: "Experience",
  projects: "Projects",
  certifications: "Certifications",
  awards: "Awards",
  leadership: "Leadership",
  extracurricular: "Extracurricular"
};

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="ml-1 block font-label text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
      {children}
    </span>
  );
}

function IconButton({
  disabled,
  icon,
  label,
  onClick,
  tone = "surface"
}: {
  disabled?: boolean;
  icon: string;
  label: string;
  onClick: () => void;
  tone?: "danger" | "surface";
}) {
  const toneClassName =
    tone === "danger"
      ? "border-error-container bg-error-container/60 text-error"
      : "border-outline-variant/20 bg-surface-container-lowest text-on-surface";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-bold transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${toneClassName}`}
    >
      <span className="inline-flex items-center gap-2">
        <span className="material-symbols-outlined text-lg">{icon}</span>
        {label}
      </span>
    </button>
  );
}

function getResumeCounts(resume: ResumeData) {
  return {
    education: resume.education.length,
    experience: resume.experience.length,
    projects: resume.projects.length,
    skills: flattenSkills(resume.skills).length
  };
}

export function ResumeImportCard({ onResumeChange, resume }: ResumeImportCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importSections, setImportSections] = useState<ResumeSectionKey[]>([]);
  const [importSourceLabel, setImportSourceLabel] = useState<string | null>(null);
  const counts = getResumeCounts(resume);

  function resetImportFeedback() {
    setImportStatus("idle");
    setImportMessage(null);
    setImportWarnings([]);
    setImportSections([]);
    setImportSourceLabel(null);
  }

  function applyImportedResume(result: ResumeImportResult, successMessage: string, sourceLabel: string, nextImportText?: string) {
    onResumeChange(result.resume);
    setImportStatus("success");
    setImportMessage(successMessage);
    setImportWarnings(result.warnings);
    setImportSections(result.summary.detectedSections);
    setImportSourceLabel(sourceLabel);

    if (typeof nextImportText === "string") {
      setImportText(nextImportText);
    }
  }

  function handleImportText() {
    if (!importText.trim()) {
      setImportStatus("error");
      setImportMessage("Paste resume text before importing.");
      setImportWarnings([]);
      setImportSections([]);
      setImportSourceLabel("Pasted text");
      return;
    }

    const result = importResumeFromText(importText);
    const hasImportedData = Boolean(
      result.resume.header.name ||
        result.resume.summary ||
        result.resume.experience.length ||
        result.resume.education.length ||
        result.resume.projects.length
    );

    if (!hasImportedData) {
      setImportStatus("error");
      setImportMessage("No structured resume content could be detected from that pasted text.");
      setImportWarnings(result.warnings);
      setImportSections(result.summary.detectedSections);
      setImportSourceLabel("Pasted text");
      return;
    }

    applyImportedResume(
      result,
      `Imported ${result.summary.experienceCount} experience, ${result.summary.educationCount} education, ${result.summary.projectCount} projects, and ${result.summary.skillCount} skills.`,
      "Pasted text"
    );
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setImportStatus("loading");
    setImportMessage(`Reading ${file.name}...`);
    setImportWarnings([]);
    setImportSections([]);
    setImportSourceLabel(file.name);

    try {
      const response = await requestImportedResumeFile(file);
      const { result } = response;

      applyImportedResume(
        result,
        `Imported ${file.name} with ${result.summary.experienceCount} experience, ${result.summary.educationCount} education, ${result.summary.projectCount} projects, and ${result.summary.skillCount} skills.`,
        file.name,
        response.extractedText
      );
    } catch (error) {
      setImportStatus("error");
      setImportMessage(error instanceof Error ? error.message : `Failed to import ${file.name}.`);
      setImportWarnings([]);
      setImportSections([]);
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest p-4">
      <div className="rounded-[1.25rem] border border-outline-variant/20 bg-white/80 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Active Resume</p>
            <p className="mt-2 font-headline text-xl font-bold text-on-surface">
              {resume.header.name?.trim() || "No resume loaded yet"}
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {resume.header.title?.trim() || "Import a resume to analyze the canonical schema output."}
            </p>
          </div>
          <Chip tone="soft">v{resume.meta.version}</Chip>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip tone="mint">{counts.experience} Exp</Chip>
          <Chip tone="lavender">{counts.education} Edu</Chip>
          <Chip tone="soft">{counts.projects} Projects</Chip>
          <Chip tone="soft">{counts.skills} Skills</Chip>
        </div>
      </div>

      <label className="mt-4 block space-y-2">
        <FieldLabel>Paste resume text</FieldLabel>
        <textarea
          className={`${fieldClassName} min-h-[180px] resize-y leading-6`}
          value={importText}
          placeholder="Paste resume text with headings like Summary, Skills, Experience, Education, and Projects."
          onChange={(event) => {
            setImportText(event.target.value);

            if (importStatus !== "idle" || importWarnings.length > 0 || importSections.length > 0 || importSourceLabel) {
              resetImportFeedback();
            }
          }}
        />
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleImportFile}
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <IconButton icon="upload" label="Import text" onClick={handleImportText} disabled={importStatus === "loading"} />
        <IconButton
          icon="attach_file"
          label={importStatus === "loading" ? "Processing..." : "Choose file"}
          onClick={() => fileInputRef.current?.click()}
          disabled={importStatus === "loading"}
        />
        <IconButton
          icon="restart_alt"
          label="Load sample"
          onClick={() => {
            onResumeChange(createMockResumeData());
            resetImportFeedback();
          }}
          disabled={importStatus === "loading"}
        />
        <IconButton
          icon="ink_eraser"
          label="Clear text"
          onClick={() => {
            setImportText("");
            resetImportFeedback();
          }}
          tone="danger"
          disabled={importStatus === "loading"}
        />
      </div>

      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
        Supports `.txt`, `.md`, `.pdf`, and `.docx` under 5 MB.
      </p>

      {importMessage ? (
        <div
          className={`mt-4 rounded-[1.25rem] border px-4 py-4 ${
            importStatus === "error"
              ? "border-error-container bg-error-container/40 text-on-surface"
              : "border-outline-variant/20 bg-surface-container-highest text-on-surface"
          }`}
        >
          <p className="text-sm font-semibold">{importMessage}</p>
          {importSourceLabel ? (
            <div className="mt-3">
              <Chip tone="lavender">{importSourceLabel}</Chip>
            </div>
          ) : null}
          {importSections.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {importSections.map((section) => (
                <Chip key={section} tone="mint">
                  {sectionLabels[section]}
                </Chip>
              ))}
            </div>
          ) : null}
          {importWarnings.length > 0 ? (
            <div className="mt-4 space-y-2 text-sm leading-6 text-on-surface-variant">
              {importWarnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
