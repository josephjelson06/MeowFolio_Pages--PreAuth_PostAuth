import { z } from "zod";

const nullableString = z.string().optional().nullable();

export const aiCompactItemSchema = z.object({
  date: nullableString,
  description: nullableString,
  link: nullableString
});

export const aiSkillGroupSchema = z.object({
  category: nullableString,
  items: z.array(z.string()).default([])
});

export const aiResumeParseSchema = z.object({
  awards: z.array(aiCompactItemSchema).default([]),
  certifications: z.array(aiCompactItemSchema).default([]),
  education: z
    .array(
      z.object({
        degree: nullableString,
        endYear: nullableString,
        field: nullableString,
        gpa: nullableString,
        institution: nullableString,
        location: nullableString,
        startYear: nullableString
      })
    )
    .default([]),
  experience: z
    .array(
      z.object({
        bullets: z.array(z.string()).default([]),
        company: nullableString,
        current: z.boolean().optional().default(false),
        description: nullableString,
        endDate: nullableString,
        id: nullableString,
        location: nullableString,
        role: nullableString,
        startDate: nullableString
      })
    )
    .default([]),
  extracurricular: z.array(aiCompactItemSchema).default([]),
  header: z.object({
    email: nullableString,
    github: nullableString,
    linkedin: nullableString,
    location: nullableString,
    name: nullableString,
    phone: nullableString,
    portfolio: nullableString,
    title: nullableString,
    website: nullableString
  }),
  leadership: z.array(aiCompactItemSchema).default([]),
  projects: z
    .array(
      z.object({
        bullets: z.array(z.string()).default([]),
        description: nullableString,
        endDate: nullableString,
        link: nullableString,
        startDate: nullableString,
        technologies: z.array(z.string()).default([]),
        title: nullableString
      })
    )
    .default([]),
  skills: z.array(z.union([z.string(), aiSkillGroupSchema])).default([]),
  summary: nullableString
});

export const atsCoachingSchema = z.object({
  issues: z
    .array(
      z.object({
        detail: z.string(),
        severity: z.enum(["Critical", "Moderate", "Low"]),
        title: z.string()
      })
    )
    .max(6)
    .default([]),
  summary: z.string()
});

export const jdRequirementSchema = z.object({
  keywords: z.array(z.string()).min(1).max(8),
  title: z.string(),
  type: z.enum(["must", "preferred"]),
  weight: z.number().min(1).max(10)
});

export const jdParseSchema = z.object({
  requirements: z.array(jdRequirementSchema).min(1).max(12),
  roleTitle: z.string().optional().nullable(),
  summary: z.string().optional().nullable()
});

export type AiResumeParse = z.infer<typeof aiResumeParseSchema>;
export type AtsCoachingResult = z.infer<typeof atsCoachingSchema>;
export type JdParseResult = z.infer<typeof jdParseSchema>;
