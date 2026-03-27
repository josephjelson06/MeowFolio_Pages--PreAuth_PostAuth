import { DEFAULT_RENDER_OPTIONS, DEFAULT_RESUME_SECTION_ORDER, type OrderedResumeSectionId, type RenderOptions, type ResumeData } from "../types/resume";
import { getTemplateDefinition, templateCatalog } from "../templates";
import { renderTemplate1ToTex } from "../templates/template1/render";
import { renderTemplate2ToTex } from "../templates/template2/render";
import { renderTemplate3ToTex } from "../templates/template3/render";
import { renderTemplate4ToTex } from "../templates/template4/render";
import { renderTemplate5ToTex } from "../templates/template5/render";
import { splitLineItems } from "./resume";

export const TEX_TEMPLATE_OPTIONS = templateCatalog.map((template) => ({
  id: template.id,
  label: template.label
})) as ReadonlyArray<{
  id: RenderOptions["templateId"];
  label: string;
}>;

export function renderOptionsToText(order: OrderedResumeSectionId[]) {
  return order.join("\n");
}

export function textToSectionOrder(value: string) {
  const allowed = new Set(DEFAULT_RESUME_SECTION_ORDER);
  const cleaned = splitLineItems(value).filter((item): item is OrderedResumeSectionId => allowed.has(item as OrderedResumeSectionId));
  return cleaned.length > 0 ? cleaned : [...DEFAULT_RESUME_SECTION_ORDER];
}

export function createInitialRenderOptions(): RenderOptions {
  return {
    ...DEFAULT_RENDER_OPTIONS,
    sectionOrder: [...DEFAULT_RENDER_OPTIONS.sectionOrder],
    sectionTitles: { ...DEFAULT_RENDER_OPTIONS.sectionTitles }
  };
}

export function renderResumeToTex(resume: ResumeData, options: RenderOptions) {
  const template = getTemplateDefinition(options.templateId);

  switch (template.id) {
    case "template5":
      return renderTemplate5ToTex(resume, options);
    case "template4":
      return renderTemplate4ToTex(resume, options);
    case "template3":
      return renderTemplate3ToTex(resume, options);
    case "template2":
      return renderTemplate2ToTex(resume, options);
    case "template1":
    default:
      return renderTemplate1ToTex(resume, options);
  }
}
