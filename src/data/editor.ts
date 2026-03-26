import { areSkillsGrouped, type ResumeData, type ResumeSkills } from "../types/resume";

const sampleSkills: ResumeSkills = ["Design Systems", "UI Design", "Interaction Design", "Figma", "Research", "Accessibility"];

const sampleResumeData: ResumeData = {
  meta: {
    version: "1.0",
    createdAt: "",
    updatedAt: "",
    source: "scratch"
  },
  header: {
    name: "Alexander Thompson",
    title: "Senior Product Designer",
    email: "alex@meowfolio.design",
    phone: "+1 (555) 000-0000",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alexthompson",
    github: "github.com/alexthompson",
    website: "alexthompson.design",
    portfolio: "portfolio.alexthompson.design"
  },
  summary:
    "Product designer focused on tactile interfaces, thoughtful systems, and expressive visual language for consumer tools.",
  skills: sampleSkills,
  experience: [
    {
      id: "northstar-labs",
      role: "Senior Product Designer",
      company: "Northstar Labs",
      location: "San Francisco, CA",
      startDate: "2021",
      endDate: null,
      current: true,
      description: null,
      bullets: [
        "Led the redesign of a mobile growth platform used by 3M+ monthly users.",
        "Built a shared component system that reduced UI inconsistency across 5 product teams.",
        "Improved task completion in onboarding flows by 21% through information architecture changes."
      ]
    },
    {
      id: "tideframe",
      role: "Product Designer",
      company: "Tideframe",
      location: "Los Angeles, CA",
      startDate: "2018",
      endDate: "2021",
      current: false,
      description: null,
      bullets: [
        "Created dashboard, reporting, and template workflows for early-career job seekers.",
        "Partnered with engineering to turn high-fidelity prototypes into reusable front-end patterns."
      ]
    }
  ],
  education: [
    {
      degree: "B.Des. in Interaction Design",
      field: "Interaction Design",
      institution: "California Institute of Arts",
      location: "Valencia, CA",
      startYear: "2014",
      endYear: "2018",
      gpa: null
    }
  ],
  projects: [
    {
      title: "MeowFolio Workspace Redesign",
      description: null,
      startDate: "2025",
      endDate: "2025",
      technologies: ["React", "TypeScript", "Tailwind", "Figma"],
      bullets: [
        "Designed a split-screen builder flow for resume editing, ATS review, and JD analysis.",
        "Created a reusable component language for cards, workspaces, and tactile navigation."
      ],
      link: "github.com/alexthompson/meowfolio"
    }
  ],
  certifications: [],
  awards: [],
  leadership: [],
  extracurricular: [],
  customSections: []
};

function cloneSkills(skills: ResumeSkills): ResumeSkills {
  if (skills.length === 0) {
    return [];
  }

  if (!areSkillsGrouped(skills)) {
    return [...skills];
  }

  return skills.map((group) => ({ category: group.category, items: [...group.items] }));
}

export function createMockResumeData(): ResumeData {
  const now = new Date().toISOString();

  return {
    meta: {
      ...sampleResumeData.meta,
      createdAt: now,
      updatedAt: now
    },
    header: { ...sampleResumeData.header },
    summary: sampleResumeData.summary,
    skills: cloneSkills(sampleResumeData.skills),
    experience: sampleResumeData.experience.map((item) => ({ ...item, bullets: [...item.bullets] })),
    education: sampleResumeData.education.map((item) => ({ ...item })),
    projects: sampleResumeData.projects.map((item) => ({
      ...item,
      technologies: [...item.technologies],
      bullets: [...item.bullets]
    })),
    certifications: sampleResumeData.certifications.map((item) => ({ ...item })),
    awards: sampleResumeData.awards.map((item) => ({ ...item })),
    leadership: sampleResumeData.leadership.map((item) => ({ ...item })),
    extracurricular: sampleResumeData.extracurricular.map((item) => ({ ...item })),
    customSections: sampleResumeData.customSections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({ ...item }))
    }))
  };
}

export const mockResumeData = createMockResumeData();
