export type ResumeSource = "scratch" | "upload" | "ai" | "import";

export type ResumeSectionKey =
  | "summary"
  | "skills"
  | "education"
  | "experience"
  | "projects"
  | "certifications"
  | "awards"
  | "leadership"
  | "extracurricular";

export interface ResumeMeta {
  version: string;
  createdAt: string;
  updatedAt: string;
  source: ResumeSource;
}

export interface ResumeHeader {
  name?: string | null;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin?: string | null;
  github?: string | null;
  website?: string | null;
  portfolio?: string | null;
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export type ResumeSkills = string[] | SkillCategory[];

export interface ExperienceItem {
  id?: string | null;
  role?: string | null;
  company?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  current?: boolean;
  description?: string | null;
  bullets: string[];
}

export interface EducationItem {
  degree?: string | null;
  field?: string | null;
  institution?: string | null;
  location?: string | null;
  startYear?: string | null;
  endYear?: string | null;
  gpa?: string | null;
}

export interface ProjectItem {
  title?: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  technologies: string[];
  bullets: string[];
  link?: string | null;
}

export interface CompactItem {
  description?: string | null;
  date?: string | null;
  link?: string | null;
}

export interface ResumeData {
  meta: ResumeMeta;
  header: ResumeHeader;
  summary?: string | null;
  skills: ResumeSkills;
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: CompactItem[];
  awards: CompactItem[];
  leadership: CompactItem[];
  extracurricular: CompactItem[];
}

export interface RenderOptions {
  templateId: string;
  fontSize: number;
  maxBulletsPerEntry: number;
  margin: string;
  pageLimit: 1 | 2;
  sectionOrder: ResumeSectionKey[];
}

export const DEFAULT_RESUME_SECTION_ORDER: ResumeSectionKey[] = [
  "summary",
  "skills",
  "education",
  "experience",
  "projects",
  "certifications",
  "awards",
  "leadership",
  "extracurricular"
];

export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  templateId: "modern",
  fontSize: 11,
  maxBulletsPerEntry: 4,
  margin: "1cm",
  pageLimit: 1,
  sectionOrder: [...DEFAULT_RESUME_SECTION_ORDER]
};

export function createEmptyResumeData(source: ResumeSource = "scratch"): ResumeData {
  const now = new Date().toISOString();

  return {
    meta: {
      version: "1.0",
      createdAt: now,
      updatedAt: now,
      source
    },
    header: {
      name: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      website: "",
      portfolio: ""
    },
    summary: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    awards: [],
    leadership: [],
    extracurricular: []
  };
}

export function areSkillsGrouped(skills: ResumeSkills): skills is SkillCategory[] {
  return skills.length > 0 && typeof skills[0] !== "string";
}
