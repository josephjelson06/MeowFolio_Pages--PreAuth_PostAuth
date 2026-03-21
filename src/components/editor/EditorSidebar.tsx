import { editorSections } from "../../data/editor";
import { Chip } from "../ui/Chip";
import { SectionHeading } from "../ui/SectionHeading";
import { AccordionSection } from "./AccordionSection";
import { EditorTabs } from "./EditorTabs";

export function EditorSidebar() {
  return (
    <div className="rounded-[2rem] border border-outline-variant/20 bg-surface-container-low p-8 shadow-ambient">
      <div className="mb-8">
        <EditorTabs />
      </div>
      <SectionHeading
        eyebrow="Workspace"
        title="Edit Details"
        description="The behavior is gone on purpose. This is a pure UI scaffold that preserves the editor's left-right structure."
      />
      <div className="mt-8 space-y-4">
        {editorSections.map((section) => (
          <AccordionSection key={section.title} icon={section.icon} title={section.title}>
            <div className="grid grid-cols-2 gap-4">
              {section.fields.map((field) => {
                const key = `${section.title}-${field.label}`;
                const isFull = Boolean(field.full) || field.kind === "textarea" || field.kind === "tag-list";

                if (field.kind === "textarea") {
                  return (
                    <label key={key} className="col-span-2 space-y-2">
                      <span className="ml-2 block font-label text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        {field.label}
                      </span>
                      <textarea
                        className="min-h-[120px] w-full resize-none rounded-2xl border-none bg-surface-container-highest px-5 py-4 text-on-surface"
                        defaultValue={String(field.value)}
                        readOnly
                      />
                    </label>
                  );
                }

                if (field.kind === "tag-list") {
                  return (
                    <div key={key} className="col-span-2 space-y-3">
                      <span className="ml-2 block font-label text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        {field.label}
                      </span>
                      <div className="flex flex-wrap gap-3 rounded-2xl bg-surface-container-highest p-4">
                        {(field.value as readonly string[]).map((tag) => (
                          <Chip key={tag} tone="lavender">
                            {tag}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <label key={key} className={isFull ? "col-span-2 space-y-2" : "space-y-2"}>
                    <span className="ml-2 block font-label text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                      {field.label}
                    </span>
                    <input
                      className="w-full rounded-2xl border-none bg-surface-container-highest px-5 py-4 text-on-surface"
                      defaultValue={String(field.value)}
                      readOnly
                    />
                  </label>
                );
              })}
            </div>
          </AccordionSection>
        ))}
      </div>
    </div>
  );
}
