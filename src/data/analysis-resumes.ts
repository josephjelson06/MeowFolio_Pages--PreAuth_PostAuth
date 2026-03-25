import { createMockResumeData } from "./editor";
import { areSkillsGrouped, type ResumeData } from "../types/resume";

export interface AnalysisResumeOption {
  accentTone: "lavender" | "mint" | "soft";
  fileLabel: string;
  id: string;
  resume: ResumeData;
  tag: string;
}

function cloneResumeData(resume: ResumeData): ResumeData {
  return {
    ...resume,
    meta: { ...resume.meta },
    header: { ...resume.header },
    summary: resume.summary,
    skills: areSkillsGrouped(resume.skills)
      ? resume.skills.map((item) => ({ category: item.category, items: [...item.items] }))
      : [...resume.skills],
    experience: resume.experience.map((item) => ({ ...item, bullets: [...item.bullets] })),
    education: resume.education.map((item) => ({ ...item })),
    projects: resume.projects.map((item) => ({
      ...item,
      technologies: [...item.technologies],
      bullets: [...item.bullets]
    })),
    certifications: resume.certifications.map((item) => ({ ...item })),
    awards: resume.awards.map((item) => ({ ...item })),
    leadership: resume.leadership.map((item) => ({ ...item })),
    extracurricular: resume.extracurricular.map((item) => ({ ...item }))
  };
}

function createResumeVariant(
  id: string,
  fileLabel: string,
  tag: string,
  accentTone: AnalysisResumeOption["accentTone"],
  patch: (resume: ResumeData) => ResumeData
) {
  return {
    accentTone,
    fileLabel,
    id,
    tag,
    resume: patch(createMockResumeData())
  } satisfies AnalysisResumeOption;
}

function getWorkspaceLabel(resume: ResumeData) {
  const base = resume.header.name?.trim() || resume.header.title?.trim() || "Current Workspace";
  return base.replace(/\s+/g, "_");
}

export function createAnalysisResumeDeck(currentResume: ResumeData): AnalysisResumeOption[] {
  return [
    {
      id: "workspace",
      fileLabel: `${getWorkspaceLabel(currentResume)}.pdf`,
      tag: "Current Workspace",
      accentTone: "mint",
      resume: cloneResumeData(currentResume)
    },
    createResumeVariant("product-design", "Senior_Product_Designer.pdf", "Design Lead", "lavender", (resume) => ({
      ...resume,
      header: {
        ...resume.header,
        name: "Alexander Thompson",
        title: "Senior Product Designer",
        location: "San Francisco, CA"
      },
      summary:
        "Senior product designer focused on consumer workflows, cross-functional product strategy, and design systems across mobile and web.",
      skills: ["Product Design", "Design Systems", "Figma", "Accessibility", "Research", "Prototyping"]
    })),
    createResumeVariant("ux-research", "UX_Strategy_Lead.pdf", "Research + UX", "soft", (resume) => ({
      ...resume,
      header: {
        ...resume.header,
        name: "Mina Alvarez",
        title: "UX Strategy Lead",
        location: "Austin, TX"
      },
      summary:
        "UX strategy lead pairing research, service design, and systems thinking to improve clarity across complex digital products.",
      skills: ["UX Research", "Service Design", "Journey Mapping", "Content Strategy", "Figma", "Facilitation"],
      experience: resume.experience.map((item, index) =>
        index === 0
          ? {
              ...item,
              role: "UX Strategy Lead",
              company: "Northstar Labs",
              bullets: [
                "Led cross-functional discovery for a multi-surface customer platform.",
                "Built service blueprints and journey maps used by design and product teams.",
                "Improved onboarding clarity by restructuring navigation and content."
              ]
            }
          : item
      )
    }))
  ];
}
