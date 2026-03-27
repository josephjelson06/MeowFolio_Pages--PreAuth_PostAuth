import { Link } from "react-router-dom";
import { flattenDescriptionLines, flattenSkills, getResumeContactLines, getSummaryText } from "../../lib/resume";
import type { ResumeData } from "../../types/resume";
import { Chip } from "../ui/Chip";

interface ResumeGalleryCardProps {
  actionLabel?: string;
  badge?: string;
  badgeTone?: "coral" | "lavender" | "mint" | "soft";
  className?: string;
  resume: ResumeData;
  subtitle: string;
  title: string;
  to: string;
  view?: "grid" | "list";
}

function ResumePreviewCanvas({ resume }: { resume: ResumeData }) {
  const name = resume.header.name?.trim() || "Your Name";
  const title = resume.header.role?.trim() || "Target Role";
  const contacts = getResumeContactLines(resume).slice(0, 4);
  const summary = getSummaryText(resume);
  const bullets = resume.experience.flatMap((item) => flattenDescriptionLines(item.description)).slice(0, 3);
  const skills = flattenSkills(resume.skills).slice(0, 4);

  return (
    <div className="resume-paper rounded-[1.2rem] p-4">
      <div className="flex h-full flex-col rounded-[1rem] bg-white p-4 shadow-ambient">
        <div className="border-b border-outline-variant/15 pb-3">
          <p className="font-headline text-lg font-extrabold text-on-surface">{name}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{title}</p>
          <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-on-surface-variant">
            {contacts.length > 0 ? contacts.map((line) => <span key={line}>{line}</span>) : <span>contact@example.com</span>}
          </div>
        </div>

        <div className="mt-4 flex flex-1 flex-col gap-3">
          <div className="space-y-2">
            <div className="h-2 w-1/4 rounded-full bg-outline-variant/25" />
            <div className="space-y-1.5">
              {(summary ? summary.split(/\s+/).slice(0, 18) : new Array(12).fill("")).slice(0, 3).map((_, index: number) => (
                <div key={`summary-${index}`} className="h-2 rounded-full bg-outline-variant/15" style={{ width: `${92 - index * 12}%` }} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-2 w-1/5 rounded-full bg-outline-variant/25" />
            <div className="space-y-1.5">
              {(bullets.length > 0 ? bullets : new Array(3).fill("")).map((bullet, index: number) => (
                <div key={`${bullet}-${index}`} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <div className="h-2 rounded-full bg-outline-variant/15" style={{ width: `${88 - index * 10}%` }} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto space-y-2">
            <div className="h-2 w-1/5 rounded-full bg-outline-variant/25" />
            <div className="flex flex-wrap gap-2">
              {(skills.length > 0 ? skills : ["Skill", "Craft", "Systems"]).slice(0, 4).map((skill) => (
                <span key={skill} className="rounded-full bg-surface-container-high px-2 py-1 text-[10px] font-bold text-on-surface-variant">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResumeGalleryCard({
  actionLabel = "Continue Editing",
  badge,
  badgeTone = "mint",
  className,
  resume,
  subtitle,
  title,
  to,
  view = "grid"
}: ResumeGalleryCardProps) {
  if (view === "list") {
    return (
      <Link
        to={to}
        className={`flex flex-col gap-5 rounded-[1.75rem] bg-white p-5 card-border shadow-tactile transition-transform hover:-translate-y-1 md:flex-row md:items-center ${className ?? ""}`}
      >
        <div className="w-full shrink-0 md:w-60">
          <ResumePreviewCanvas resume={resume} />
        </div>
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="font-headline text-2xl font-extrabold text-on-surface">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{subtitle}</p>
            </div>
            {badge ? <Chip tone={badgeTone}>{badge}</Chip> : null}
          </div>
          <div className="mt-auto flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Chip tone="soft">{resume.experience.length} experience</Chip>
              <Chip tone="soft">{flattenSkills(resume.skills).length} skills</Chip>
            </div>
            <span className="chunky-button rounded-xl bg-primary px-5 py-3 font-label text-sm font-bold text-on-primary">{actionLabel}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className={`group overflow-hidden rounded-[1.75rem] bg-white card-border shadow-tactile transition-transform hover:-translate-y-1 ${className ?? ""}`}
    >
      <div className="relative h-56 overflow-hidden bg-surface-container-highest p-4">
        <div className="soft-grid absolute inset-0 opacity-60" />
        <div className="relative h-full">
          <ResumePreviewCanvas resume={resume} />
        </div>
        {badge ? (
          <div className="absolute right-6 top-6">
            <Chip tone={badgeTone}>{badge}</Chip>
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div>
          <h3 className="font-headline text-xl font-extrabold text-on-surface">{title}</h3>
          <p className="mt-2 text-sm text-on-surface-variant">{subtitle}</p>
        </div>
        <span className="chunky-button inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 font-label text-sm font-bold text-on-primary">
          {actionLabel}
        </span>
      </div>
    </Link>
  );
}
