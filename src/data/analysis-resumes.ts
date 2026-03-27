import { createMockResumeData } from "./editor";
import type { ResumeData } from "../types/resume";

export interface AnalysisResumeOption {
  accentTone: "lavender" | "mint" | "soft";
  fileLabel: string;
  id: string;
  resume: ResumeData;
  tag: string;
}

function cloneResumeData(resume: ResumeData): ResumeData {
  return structuredClone(resume);
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
  const base = resume.header.name?.trim() || resume.header.role?.trim() || "Current Workspace";
  return base.replace(/\s+/g, "_");
}

export function createAnalysisResumeDeck(currentResume: ResumeData): AnalysisResumeOption[] {
  return [
    {
      accentTone: "mint",
      fileLabel: `${getWorkspaceLabel(currentResume)}.pdf`,
      id: "workspace",
      resume: cloneResumeData(currentResume),
      tag: "Current Workspace"
    },
    createResumeVariant("product-design", "Senior_Product_Designer.pdf", "Design Lead", "lavender", (resume) => ({
      ...resume,
      header: {
        ...resume.header,
        address: "San Francisco, CA",
        name: "Alexander Thompson",
        role: "Senior Product Designer"
      },
      skills: {
        groups: [],
        items: ["Product Design", "Design Systems", "Figma", "Accessibility", "Research", "Prototyping"],
        mode: "csv"
      },
      summary: {
        content:
          "Senior product designer focused on consumer workflows, cross-functional product strategy, and design systems across mobile and web.",
        mode: "professional-summary"
      }
    })),
    createResumeVariant("ux-research", "UX_Strategy_Lead.pdf", "Research + UX", "soft", (resume) => ({
      ...resume,
      experience: resume.experience.map((item, index) =>
        index === 0
          ? {
              ...item,
              company: "Northstar Labs",
              description: {
                ...item.description,
                bullets: [
                  "Led cross-functional discovery for a multi-surface customer platform.",
                  "Built service blueprints and journey maps used by design and product teams.",
                  "Improved onboarding clarity by restructuring navigation and content."
                ]
              },
              role: "UX Strategy Lead"
            }
          : item
      ),
      header: {
        ...resume.header,
        address: "Austin, TX",
        name: "Mina Alvarez",
        role: "UX Strategy Lead"
      },
      skills: {
        groups: [],
        items: ["UX Research", "Service Design", "Journey Mapping", "Content Strategy", "Figma", "Facilitation"],
        mode: "csv"
      },
      summary: {
        content:
          "UX strategy lead pairing research, service design, and systems thinking to improve clarity across complex digital products.",
        mode: "professional-summary"
      }
    }))
  ];
}
