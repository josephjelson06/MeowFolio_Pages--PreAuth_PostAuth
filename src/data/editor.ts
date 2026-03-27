import {
  createEmptyDateField,
  createEmptyDescriptionField,
  createEmptyLinkField,
  createEmptyResumeData,
  type ResumeData
} from "../types/resume";

const sampleResumeData: ResumeData = {
  ...createEmptyResumeData("scratch"),
  achievements: {
    entries: [],
    label: "Achievements"
  },
  certifications: [
    {
      date: {
        ...createEmptyDateField("yyyy"),
        startYear: "2024"
      },
      description: "Completed with distinction.",
      issuer: "Coursera",
      link: {
        ...createEmptyLinkField(),
        url: "https://coursera.org/example"
      },
      title: "Google UX Certificate"
    }
  ],
  education: [
    {
      boardOrUniversity: "California Institute of Arts",
      date: {
        ...createEmptyDateField("yyyy-range"),
        endYear: "2018",
        startYear: "2014"
      },
      degree: "B.Des.",
      field: "Interaction Design",
      institution: "California Institute of Arts",
      level: "degree-diploma",
      location: "Valencia, CA",
      result: "",
      resultType: null
    }
  ],
  experience: [
    {
      company: "Northstar Labs",
      date: {
        ...createEmptyDateField("yyyy-present"),
        isOngoing: true,
        startYear: "2021"
      },
      description: {
        ...createEmptyDescriptionField("bullets"),
        bullets: [
          "Led the redesign of a mobile growth platform used by 3M+ monthly users.",
          "Built a shared component system that reduced UI inconsistency across 5 product teams.",
          "Improved task completion in onboarding flows by 21% through information architecture changes."
        ]
      },
      isCurrent: true,
      location: "San Francisco, CA",
      role: "Senior Product Designer"
    },
    {
      company: "Tideframe",
      date: {
        ...createEmptyDateField("yyyy-range"),
        endYear: "2021",
        startYear: "2018"
      },
      description: {
        ...createEmptyDescriptionField("bullets"),
        bullets: [
          "Created dashboard, reporting, and template workflows for early-career job seekers.",
          "Partnered with engineering to turn high-fidelity prototypes into reusable front-end patterns."
        ]
      },
      isCurrent: false,
      location: "Los Angeles, CA",
      role: "Product Designer"
    }
  ],
  extracurricular: {
    entries: [],
    label: "Extra-Curricular"
  },
  header: {
    address: "San Francisco, CA",
    email: "alex@meowfolio.design",
    github: {
      ...createEmptyLinkField(),
      url: "github.com/alexthompson"
    },
    linkedin: {
      ...createEmptyLinkField(),
      url: "linkedin.com/in/alexthompson"
    },
    name: "Alexander Thompson",
    phone: "+1 (555) 000-0000",
    role: "Senior Product Designer",
    website: {
      ...createEmptyLinkField(),
      url: "alexthompson.design"
    }
  },
  hobbies: {
    groups: [],
    items: ["Photography", "Climbing", "Film"],
    mode: "csv"
  },
  languages: {
    groups: [],
    items: [
      {
        language: "English",
        proficiency: "native"
      }
    ],
    mode: "csv"
  },
  leadership: {
    entries: [
      {
        date: {
          ...createEmptyDateField("yyyy-range"),
          endYear: "2023",
          startYear: "2022"
        },
        description: {
          ...createEmptyDescriptionField("paragraph"),
          mode: "paragraph",
          paragraph: "Led the design mentorship circle for six junior designers."
        },
        link: createEmptyLinkField(),
        location: "",
        subtitle: "MeowFolio Design Circle",
        title: "Mentor Lead"
      }
    ],
    label: "Leaderships"
  },
  openSource: {
    entries: [],
    label: "Open-Source"
  },
  projects: [
    {
      date: {
        ...createEmptyDateField("yyyy"),
        startYear: "2025"
      },
      description: {
        ...createEmptyDescriptionField("bullets"),
        bullets: [
          "Designed a split-screen builder flow for resume editing, ATS review, and JD analysis.",
          "Created a reusable component language for cards, workspaces, and tactile navigation."
        ]
      },
      githubLink: {
        ...createEmptyLinkField(),
        url: "github.com/alexthompson/meowfolio"
      },
      liveLink: createEmptyLinkField(),
      technologies: ["React", "TypeScript", "Tailwind", "Figma"],
      title: "MeowFolio Workspace Redesign"
    }
  ],
  publications: {
    entries: [],
    label: "Publications"
  },
  skills: {
    groups: [],
    items: ["Design Systems", "UI Design", "Interaction Design", "Figma", "Research", "Accessibility"],
    mode: "csv"
  },
  summary: {
    content: "Product designer focused on tactile interfaces, thoughtful systems, and expressive visual language for consumer tools.",
    mode: "professional-summary"
  }
};

export function createMockResumeData(): ResumeData {
  return structuredClone(sampleResumeData);
}

export const mockResumeData = createMockResumeData();
