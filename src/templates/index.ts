import type { RenderTemplateId } from "../types/resume";
import { template1Definition } from "./template1/definition";
import { template2Definition } from "./template2/definition";
import { template3Definition } from "./template3/definition";
import { template4Definition } from "./template4/definition";
import { template5Definition } from "./template5/definition";
import type { TemplateDefinition } from "./types";

export type { TemplateDefinition } from "./types";

export const templateCatalog: TemplateDefinition[] = [
  template1Definition,
  template2Definition,
  template3Definition,
  template4Definition,
  template5Definition
];

const templateMap = new Map(templateCatalog.map((template) => [template.id, template]));

export function isRenderTemplateId(value: unknown): value is RenderTemplateId {
  return typeof value === "string" && templateMap.has(value as RenderTemplateId);
}

export function getTemplateDefinition(templateId: RenderTemplateId | string) {
  return templateMap.get(templateId as RenderTemplateId) ?? template1Definition;
}
