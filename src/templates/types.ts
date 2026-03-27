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
