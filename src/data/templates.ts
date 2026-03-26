import type { RenderTemplateId } from "../types/resume";

export interface TemplateDefinition {
  badge: string;
  badgeTone: "coral" | "lavender" | "mint" | "soft";
  bestFor: string;
  density: "airy" | "balanced" | "tight";
  description: string;
  headerLayout: "center" | "left";
  id: RenderTemplateId;
  label: string;
  sectionStyle: "capsule" | "rule" | "underline";
}

export const templateCatalog: TemplateDefinition[] = [
  {
    badge: "Classic",
    badgeTone: "soft",
    bestFor: "General applications and graceful one-to-two page expansion",
    density: "balanced",
    description:
      "A structured entry-level layout with a centered name block, classic section rhythm, and graceful continuation onto page two when content grows.",
    headerLayout: "center",
    id: "classic",
    label: "Classic",
    sectionStyle: "rule"
  },
  {
    badge: "Balanced",
    badgeTone: "mint",
    bestFor: "General tech roles and all-purpose applications",
    density: "balanced",
    description:
      "A clean, confident layout with strong hierarchy, balanced spacing, and clear ATS-friendly section flow.",
    headerLayout: "left",
    id: "modern",
    label: "Modern",
    sectionStyle: "rule"
  },
  {
    badge: "One-page",
    badgeTone: "coral",
    bestFor: "High-signal one-page resumes with tight spacing",
    density: "tight",
    description:
      "A denser layout that keeps more detail on one page without losing the structure of the canonical schema.",
    headerLayout: "left",
    id: "compact",
    label: "Compact",
    sectionStyle: "capsule"
  },
  {
    badge: "Story-led",
    badgeTone: "lavender",
    bestFor: "Design, strategy, and editorial-leaning profiles",
    density: "airy",
    description:
      "A more spacious template with centered presentation and stronger editorial rhythm for polished applications.",
    headerLayout: "center",
    id: "editorial",
    label: "Editorial",
    sectionStyle: "underline"
  }
];

const templateMap = new Map(templateCatalog.map((template) => [template.id, template]));

export function isRenderTemplateId(value: unknown): value is RenderTemplateId {
  return typeof value === "string" && templateMap.has(value as RenderTemplateId);
}

export function getTemplateDefinition(templateId: RenderTemplateId | string) {
  return templateMap.get(templateId as RenderTemplateId) ?? templateMap.get("modern")!;
}
