import { z } from "zod";

const nullableString = z.string().optional().nullable();

export const aiDateFieldSchema = z.object({
  endMonth: nullableString,
  endYear: nullableString,
  isOngoing: z.boolean().optional().default(false),
  mode: z.enum(["mm-yyyy", "yyyy", "mm-yyyy-range", "yyyy-range", "mm-yyyy-present", "yyyy-present"]),
  startMonth: nullableString,
  startYear: nullableString
});

export const aiLinkFieldSchema = z.object({
  displayMode: z.enum(["plain-url", "hyperlinked-text"]).default("plain-url"),
  displayText: nullableString,
  url: nullableString
});

export const aiDescriptionFieldSchema = z.object({
  bullets: z.array(z.string()).default([]),
  mode: z.enum(["bullets", "paragraph"]).default("bullets"),
  paragraph: nullableString
});

export const aiSkillGroupSchema = z.object({
  groupLabel: nullableString,
  items: z.array(z.string()).default([])
});

export const aiCustomEntrySchema = z.object({
  date: aiDateFieldSchema,
  description: aiDescriptionFieldSchema,
  link: aiLinkFieldSchema,
  location: nullableString,
  subtitle: nullableString,
  title: nullableString
});

export const aiCustomSectionSchema = z.object({
  entries: z.array(aiCustomEntrySchema).default([]),
  label: nullableString
});

export const aiLanguageItemSchema = z.object({
  language: nullableString,
  proficiency: z.enum(["native", "fluent", "conversational", "basic"]).optional().nullable()
});

export const aiResumeParseSchema = z.object({
  achievements: aiCustomSectionSchema,
  certifications: z
    .array(
      z.object({
        date: aiDateFieldSchema,
        description: nullableString,
        issuer: nullableString,
        link: aiLinkFieldSchema,
        title: nullableString
      })
    )
    .default([]),
  competitions: aiCustomSectionSchema,
  education: z
    .array(
      z.object({
        boardOrUniversity: nullableString,
        date: aiDateFieldSchema,
        degree: nullableString,
        field: nullableString,
        institution: nullableString,
        level: z.enum(["degree-diploma", "class-12", "class-10", "other"]).default("degree-diploma"),
        location: nullableString,
        result: nullableString,
        resultType: z.enum(["cgpa-10", "gpa-4", "percentage", "grade", "not-disclosed"]).optional().nullable()
      })
    )
    .default([]),
  experience: z
    .array(
      z.object({
        company: nullableString,
        date: aiDateFieldSchema,
        description: aiDescriptionFieldSchema,
        isCurrent: z.boolean().optional().default(false),
        location: nullableString,
        role: nullableString
      })
    )
    .default([]),
  extracurricular: aiCustomSectionSchema,
  header: z.object({
    address: nullableString,
    email: nullableString,
    github: aiLinkFieldSchema,
    linkedin: aiLinkFieldSchema,
    name: nullableString,
    phone: nullableString,
    role: nullableString,
    website: aiLinkFieldSchema
  }),
  hobbies: z.object({
    groups: z.array(aiSkillGroupSchema).default([]),
    items: z.array(z.string()).default([]),
    mode: z.enum(["csv", "grouped"]).default("csv")
  }),
  languages: z.object({
    groups: z.array(aiSkillGroupSchema).default([]),
    items: z.array(aiLanguageItemSchema).default([]),
    mode: z.enum(["csv", "grouped"]).default("csv")
  }),
  leadership: aiCustomSectionSchema,
  openSource: aiCustomSectionSchema,
  projects: z
    .array(
      z.object({
        date: aiDateFieldSchema,
        description: aiDescriptionFieldSchema,
        githubLink: aiLinkFieldSchema,
        liveLink: aiLinkFieldSchema,
        technologies: z.array(z.string()).default([]),
        title: nullableString
      })
    )
    .default([]),
  publications: aiCustomSectionSchema,
  skills: z.object({
    groups: z.array(aiSkillGroupSchema).default([]),
    items: z.array(z.string()).default([]),
    mode: z.enum(["csv", "grouped"]).default("csv")
  }),
  summary: z.object({
    content: nullableString,
    mode: z.enum(["career-objective", "professional-summary"]).default("professional-summary")
  })
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
