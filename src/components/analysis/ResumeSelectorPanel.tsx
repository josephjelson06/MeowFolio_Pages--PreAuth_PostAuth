import { flattenDescriptionLines, flattenSkills, getSummaryText } from "../../lib/resume";
import type { ResumeData } from "../../types/resume";
import type { AnalysisResumeOption } from "../../data/analysis-resumes";
import { Chip } from "../ui/Chip";
import { Panel } from "../ui/Panel";
import { SectionHeading } from "../ui/SectionHeading";

interface ResumeSelectorPanelProps {
  currentIndex: number;
  description: string;
  onNext: () => void;
  onPrevious: () => void;
  resumes: AnalysisResumeOption[];
  title: string;
}

function countResumeSections(resume: ResumeData) {
  return [
    getSummaryText(resume),
    flattenSkills(resume.skills).length > 0,
    resume.education.length > 0,
    resume.experience.length > 0,
    resume.projects.length > 0,
    resume.certifications.length > 0,
    resume.achievements.entries.length > 0,
    resume.leadership.entries.length > 0,
    resume.extracurricular.entries.length > 0
  ].filter(Boolean).length;
}

function ResumeFrame({ resume }: { resume: ResumeData }) {
  const name = resume.header.name?.trim() || "Your Name";
  const title = resume.header.role?.trim() || "Target Role";
  const summary = getSummaryText(resume);
  const bullets = resume.experience.flatMap((item) => flattenDescriptionLines(item.description)).slice(0, 4);

  return (
    <div className="aspect-[3/4] rounded-[1.75rem] border border-outline-variant/20 bg-white p-5 shadow-ambient">
      <div className="flex h-full flex-col rounded-[1.5rem] border border-outline-variant/15 bg-gradient-to-b from-surface-container-lowest via-white to-surface-container-lowest px-5 py-6">
        <div className="shrink-0 border-b border-outline-variant/10 pb-4">
          <p className="font-headline text-xl font-extrabold text-on-surface">{name}</p>
          <p className="mt-1 text-sm font-medium text-primary">{title}</p>
        </div>
        <div className="mt-4 flex flex-1 flex-col gap-3">
          <div className="space-y-2">
            <div className="h-2 w-1/3 rounded-full bg-outline-variant/25" />
            <div className="h-2 w-full rounded-full bg-outline-variant/15" />
            <div className="h-2 w-5/6 rounded-full bg-outline-variant/15" />
            <div className="h-2 w-4/6 rounded-full bg-outline-variant/15" />
          </div>
          <div className="mt-2 space-y-2">
            <div className="h-2 w-1/4 rounded-full bg-outline-variant/25" />
            {(summary ? [summary, ...bullets] : bullets.length > 0 ? bullets : new Array(4).fill("")).slice(0, 4).map((line, index: number) => (
              <div
                key={`${line}-${index}`}
                className="h-2 rounded-full bg-outline-variant/15"
                style={{ width: `${92 - index * 9}%` }}
              />
            ))}
          </div>
          <div className="mt-auto space-y-2">
            <div className="h-2 w-1/4 rounded-full bg-outline-variant/25" />
            <div className="h-2 w-full rounded-full bg-outline-variant/15" />
            <div className="h-2 w-3/4 rounded-full bg-outline-variant/15" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResumeSelectorPanel({
  currentIndex,
  description,
  onNext,
  onPrevious,
  resumes,
  title
}: ResumeSelectorPanelProps) {
  const activeResume = resumes[currentIndex] ?? resumes[0];
  const activeSkills = flattenSkills(activeResume.resume.skills).length;
  const activeSections = countResumeSections(activeResume.resume);

  return (
    <Panel className="flex h-full min-h-0 flex-col p-8">
      <SectionHeading eyebrow="Preparation" title={title} description={description} />

      <div className="mt-8 flex min-h-0 flex-1 flex-col">
        <div className="relative mx-auto w-full max-w-[290px]">
          <button
            type="button"
            onClick={onPrevious}
            className="absolute -left-5 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-lowest shadow-tactile-sm transition hover:-translate-y-[52%]"
            aria-label="Show previous resume"
          >
            <span className="material-symbols-outlined text-on-surface">chevron_left</span>
          </button>

          <div className="rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-ambient">
            <ResumeFrame resume={activeResume.resume} />

            <div className="mt-4 flex items-center justify-between gap-3 px-1">
              <div className="min-w-0">
                <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Active Resume</p>
                <p className="mt-1 truncate font-headline text-lg font-bold text-on-surface">{activeResume.fileLabel}</p>
              </div>
              <Chip tone={activeResume.accentTone}>{currentIndex + 1}/{resumes.length}</Chip>
            </div>
          </div>

          <button
            type="button"
            onClick={onNext}
            className="absolute -right-5 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-lowest shadow-tactile-sm transition hover:-translate-y-[52%]"
            aria-label="Show next resume"
          >
            <span className="material-symbols-outlined text-on-surface">chevron_right</span>
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Chip tone={activeResume.accentTone}>{activeResume.tag}</Chip>
          <Chip tone="soft">{activeSections}/9 sections</Chip>
          <Chip tone="soft">{activeSkills} skills</Chip>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded-[1.25rem] bg-surface-container-lowest px-4 py-3">
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Current role</p>
            <p className="mt-2 text-sm font-semibold text-on-surface">{activeResume.resume.header.role?.trim() || "No title set yet"}</p>
          </div>
          <div className="rounded-[1.25rem] bg-surface-container-lowest px-4 py-3">
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Switch resumes</p>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Use the left and right arrows to cycle through resume variants before running the analysis.
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}
