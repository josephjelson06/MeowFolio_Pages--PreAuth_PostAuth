export type ResumeSource = "scratch" | "upload" | "ai" | "import";
export type RenderTemplateId = "classic" | "modern" | "compact" | "editorial";

export type MonthValue =
  | "Jan"
  | "Feb"
  | "Mar"
  | "Apr"
  | "May"
  | "Jun"
  | "Jul"
  | "Aug"
  | "Sep"
  | "Oct"
  | "Nov"
  | "Dec";

export const MONTH_OPTIONS: MonthValue[] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type DateFieldMode =
  | "mm-yyyy"
  | "yyyy"
  | "mm-yyyy-range"
  | "yyyy-range"
  | "mm-yyyy-present"
  | "yyyy-present";

export type LinkDisplayMode = "plain-url" | "hyperlinked-text";
export type DescriptionMode = "bullets" | "paragraph";
export type ProfileMode = "career-objective" | "professional-summary";
export type GroupedInputMode = "csv" | "grouped";
export type ResultType = "cgpa-10" | "gpa-4" | "percentage" | "grade" | "not-disclosed";
export type EducationLevel = "degree-diploma" | "class-12" | "class-10" | "other";
export type LanguageProficiency = "native" | "fluent" | "conversational" | "basic";

export type ResumeSectionKey =
  | "summary"
  | "education"
  | "skills"
  | "experience"
  | "projects"
  | "certifications"
  | "leadership"
  | "achievements"
  | "competitions"
  | "extracurricular"
  | "publications"
  | "openSource"
  | "languages"
  | "hobbies";

export type GenericCustomSectionKey =
  | "leadership"
  | "achievements"
  | "competitions"
  | "extracurricular"
  | "publications"
  | "openSource";

export type OrderedResumeSectionId = ResumeSectionKey;

export interface ResumeMeta {
  version: string;
  createdAt: string;
  updatedAt: string;
  source: ResumeSource;
}

export interface DateField {
  mode: DateFieldMode;
  startMonth?: MonthValue | "" | null;
  startYear?: string | null;
  endMonth?: MonthValue | "" | null;
  endYear?: string | null;
  isOngoing?: boolean;
}

export interface LinkField {
  url?: string | null;
  displayMode: LinkDisplayMode;
  displayText?: string | null;
}

export interface DescriptionField {
  mode: DescriptionMode;
  bullets: string[];
  paragraph?: string | null;
}

export interface ResumeHeader {
  name?: string | null;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  github: LinkField;
  linkedin: LinkField;
  website: LinkField;
}

export interface ProfileSection {
  mode: ProfileMode;
  content?: string | null;
}

export interface EducationEntry {
  level: EducationLevel;
  degree?: string | null;
  field?: string | null;
  institution?: string | null;
  boardOrUniversity?: string | null;
  location?: string | null;
  date: DateField;
  result?: string | null;
  resultType?: ResultType | null;
}

export interface SkillGroup {
  groupLabel?: string | null;
  items: string[];
}

export interface SkillsSection {
  mode: GroupedInputMode;
  items: string[];
  groups: SkillGroup[];
}

export interface ExperienceEntry {
  role?: string | null;
  company?: string | null;
  location?: string | null;
  date: DateField;
  isCurrent: boolean;
  description: DescriptionField;
}

export interface ProjectEntry {
  title?: string | null;
  githubLink: LinkField;
  liveLink: LinkField;
  date: DateField;
  technologies: string[];
  description: DescriptionField;
}

export interface CertificationEntry {
  title?: string | null;
  issuer?: string | null;
  description?: string | null;
  date: DateField;
  link: LinkField;
}

export interface CustomEntry {
  title?: string | null;
  subtitle?: string | null;
  location?: string | null;
  date: DateField;
  link: LinkField;
  description: DescriptionField;
}

export interface CustomEntriesSection {
  label: string;
  entries: CustomEntry[];
}

export interface LanguageItem {
  language?: string | null;
  proficiency?: LanguageProficiency | null;
}

export interface LanguagesSection {
  mode: GroupedInputMode;
  items: LanguageItem[];
  groups: SkillGroup[];
}

export interface HobbiesSection {
  mode: GroupedInputMode;
  items: string[];
  groups: SkillGroup[];
}

export interface ResumeData {
  meta: ResumeMeta;
  header: ResumeHeader;
  summary: ProfileSection;
  education: EducationEntry[];
  skills: SkillsSection;
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  leadership: CustomEntriesSection;
  achievements: CustomEntriesSection;
  competitions: CustomEntriesSection;
  extracurricular: CustomEntriesSection;
  publications: CustomEntriesSection;
  openSource: CustomEntriesSection;
  languages: LanguagesSection;
  hobbies: HobbiesSection;
}

export interface RenderOptions {
  templateId: RenderTemplateId;
  fontSize: number;
  maxBulletsPerEntry: number;
  margin: string;
  pageLimit: 1 | 2;
  sectionOrder: OrderedResumeSectionId[];
  sectionTitles: Partial<Record<ResumeSectionKey, string>>;
}

export const GENERIC_CUSTOM_SECTION_LABELS: Record<GenericCustomSectionKey, string> = {
  achievements: "Achievements",
  competitions: "Competitions",
  extracurricular: "Extra-Curricular",
  leadership: "Leaderships",
  openSource: "Open-Source",
  publications: "Publications"
};

export const RESUME_SECTION_LABELS: Record<ResumeSectionKey, string> = {
  achievements: GENERIC_CUSTOM_SECTION_LABELS.achievements,
  certifications: "Certifications",
  competitions: GENERIC_CUSTOM_SECTION_LABELS.competitions,
  education: "Education",
  experience: "Experience / Internships",
  extracurricular: GENERIC_CUSTOM_SECTION_LABELS.extracurricular,
  hobbies: "Hobbies & Interests",
  languages: "Languages Known",
  leadership: GENERIC_CUSTOM_SECTION_LABELS.leadership,
  openSource: GENERIC_CUSTOM_SECTION_LABELS.openSource,
  projects: "Projects",
  publications: GENERIC_CUSTOM_SECTION_LABELS.publications,
  skills: "Skills",
  summary: "Professional Summary"
};

export const DEFAULT_RESUME_SECTION_ORDER: ResumeSectionKey[] = [
  "summary",
  "education",
  "skills",
  "experience",
  "projects",
  "certifications",
  "leadership",
  "achievements",
  "competitions",
  "extracurricular",
  "publications",
  "openSource",
  "languages",
  "hobbies"
];

export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  templateId: "modern",
  fontSize: 11,
  maxBulletsPerEntry: 4,
  margin: "1cm",
  pageLimit: 1,
  sectionOrder: [...DEFAULT_RESUME_SECTION_ORDER],
  sectionTitles: {}
};

export function createEmptyDateField(mode: DateFieldMode = "mm-yyyy-range"): DateField {
  return {
    endMonth: "",
    endYear: "",
    isOngoing: mode.endsWith("present"),
    mode,
    startMonth: "",
    startYear: ""
  };
}

export function createEmptyLinkField(): LinkField {
  return {
    displayMode: "plain-url",
    displayText: "",
    url: ""
  };
}

export function createEmptyDescriptionField(mode: DescriptionMode = "bullets"): DescriptionField {
  return {
    bullets: [],
    mode,
    paragraph: ""
  };
}

export function createEmptySkillGroup(): SkillGroup {
  return {
    groupLabel: "",
    items: []
  };
}

export function createEmptyCustomEntry(): CustomEntry {
  return {
    date: createEmptyDateField("mm-yyyy"),
    description: createEmptyDescriptionField("bullets"),
    link: createEmptyLinkField(),
    location: "",
    subtitle: "",
    title: ""
  };
}

export function createEmptyCustomSection(key: GenericCustomSectionKey): CustomEntriesSection {
  return {
    entries: [],
    label: GENERIC_CUSTOM_SECTION_LABELS[key]
  };
}

export function createEmptyResumeData(source: ResumeSource = "scratch"): ResumeData {
  const now = new Date().toISOString();

  return {
    achievements: createEmptyCustomSection("achievements"),
    certifications: [],
    competitions: createEmptyCustomSection("competitions"),
    education: [],
    experience: [],
    extracurricular: createEmptyCustomSection("extracurricular"),
    header: {
      address: "",
      email: "",
      github: createEmptyLinkField(),
      linkedin: createEmptyLinkField(),
      name: "",
      phone: "",
      role: "",
      website: createEmptyLinkField()
    },
    hobbies: {
      groups: [],
      items: [],
      mode: "csv"
    },
    languages: {
      groups: [],
      items: [],
      mode: "csv"
    },
    leadership: createEmptyCustomSection("leadership"),
    meta: {
      createdAt: now,
      source,
      updatedAt: now,
      version: "2.0"
    },
    openSource: createEmptyCustomSection("openSource"),
    projects: [],
    publications: createEmptyCustomSection("publications"),
    skills: {
      groups: [],
      items: [],
      mode: "csv"
    },
    summary: {
      content: "",
      mode: "professional-summary"
    }
  };
}

export function isResumeSectionKey(value: string): value is ResumeSectionKey {
  return value in RESUME_SECTION_LABELS;
}

export function isGenericCustomSectionKey(value: string): value is GenericCustomSectionKey {
  return value in GENERIC_CUSTOM_SECTION_LABELS;
}
