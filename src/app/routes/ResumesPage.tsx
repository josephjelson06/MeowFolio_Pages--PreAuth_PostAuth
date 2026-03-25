import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { ResumeGalleryCard } from "../../components/resume/ResumeGalleryCard";
import { Chip } from "../../components/ui/Chip";
import { createAnalysisResumeDeck } from "../../data/analysis-resumes";
import { getTemplateDefinition } from "../../data/templates";
import { useWorkspace } from "../workspace/WorkspaceContext";

type ResumeViewMode = "grid" | "list";

export function ResumesPage() {
  const { renderOptions, resume } = useWorkspace();
  const [view, setView] = useState<ResumeViewMode>("grid");
  const selectedTemplate = getTemplateDefinition(renderOptions.templateId);
  const resumeDeck = createAnalysisResumeDeck(resume);

  return (
    <AppLayout contentClassName="px-6 py-10 md:px-8 lg:px-16">
      <div className="w-full">
        <header className="mb-16 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Chip tone="soft">Workspace</Chip>
              <Chip tone={selectedTemplate.badgeTone}>{selectedTemplate.label}</Chip>
            </div>
            <h1 className="font-headline text-5xl font-extrabold tracking-tight text-on-surface md:text-6xl">
              My <span className="text-primary italic">Resumes</span>
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-on-surface-variant">
              Manage your saved directions, jump back into editing, and keep a few focused resume variants ready for
              different application goals.
            </p>
          </div>

          <div className="flex items-center rounded-full bg-surface-container-high p-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={
                view === "grid"
                  ? "inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-6 py-3 font-label text-sm font-bold text-primary shadow-sm"
                  : "inline-flex items-center gap-2 rounded-full px-6 py-3 font-label text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-highest"
              }
            >
              <span className="material-symbols-outlined">grid_view</span>
              Grid View
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={
                view === "list"
                  ? "inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-6 py-3 font-label text-sm font-bold text-primary shadow-sm"
                  : "inline-flex items-center gap-2 rounded-full px-6 py-3 font-label text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-highest"
              }
            >
              <span className="material-symbols-outlined">view_list</span>
              List View
            </button>
          </div>
        </header>

        {view === "grid" ? (
          <section className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {resumeDeck.map((item, index) => (
              <ResumeGalleryCard
                key={item.id}
                resume={item.resume}
                title={item.resume.header.title?.trim() || item.tag}
                subtitle={
                  item.id === "workspace"
                    ? "Current workspace resume"
                    : index === 1
                      ? "Updated yesterday"
                      : "Tailored for another application track"
                }
                badge={item.id === "workspace" ? "ACTIVE RESUME" : item.tag.toUpperCase()}
                badgeTone={item.accentTone}
                to="/editor"
              />
            ))}

            <Link
              to="/editor"
              className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-[1.75rem] border-2 border-dashed border-outline-variant bg-surface-container-lowest/50 p-8 text-center no-underline transition-colors hover:bg-surface-container-low"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-outline-variant bg-surface-container">
                <span className="material-symbols-outlined text-3xl text-primary">add</span>
              </div>
              <p className="font-label font-bold text-on-surface-variant">Create New Resume</p>
            </Link>
          </section>
        ) : (
          <section className="space-y-6">
            {resumeDeck.map((item, index) => (
              <ResumeGalleryCard
                key={item.id}
                view="list"
                resume={item.resume}
                title={item.resume.header.title?.trim() || item.tag}
                subtitle={
                  item.id === "workspace"
                    ? "Current workspace resume"
                    : index === 1
                      ? "Updated yesterday"
                      : "Tailored for another application track"
                }
                badge={item.id === "workspace" ? "ACTIVE RESUME" : item.tag.toUpperCase()}
                badgeTone={item.accentTone}
                to="/editor"
              />
            ))}
          </section>
        )}

        <footer className="mt-12 flex flex-col gap-6 rounded-[1.5rem] border-2 border-charcoal bg-surface-container-lowest p-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-bold text-on-surface-variant">
            Showing 1-{resumeDeck.length} of {resumeDeck.length} resumes
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full border-2 border-charcoal bg-surface-container-highest text-on-surface-variant opacity-50"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-charcoal bg-primary font-bold text-on-primary">
              1
            </button>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-charcoal bg-surface-container-lowest font-bold text-on-surface">
              2
            </button>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-charcoal bg-surface-container-lowest font-bold text-on-surface">
              3
            </button>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-charcoal bg-surface-container-lowest text-on-surface-variant">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}
