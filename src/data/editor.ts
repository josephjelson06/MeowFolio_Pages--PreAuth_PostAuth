export interface EditorField {
  kind?: "input" | "textarea" | "tag-list";
  label: string;
  value: string | readonly string[];
  full?: boolean;
}

export interface EditorSection {
  title: string;
  icon: string;
  fields: readonly EditorField[];
}

export const editorSections: readonly EditorSection[] = [
  {
    title: "Personal Details",
    icon: "person",
    fields: [
      { label: "Full Name", value: "Alexander Thompson", full: true },
      { label: "Role", value: "Senior Product Designer", full: true },
      { label: "Email", value: "alex@meowfolio.design" },
      { label: "Phone", value: "+1 (555) 000-0000" },
      { label: "Location", value: "San Francisco, CA", full: true }
    ]
  },
  {
    title: "Professional Summary",
    icon: "auto_awesome",
    fields: [
      {
        label: "Summary",
        kind: "textarea",
        value:
          "Passionate product designer with 8+ years of experience building tactile design systems, mobile workflows, and polished interaction patterns for consumer products."
      }
    ]
  },
  {
    title: "Experience",
    icon: "work",
    fields: [
      {
        label: "Current Role",
        kind: "textarea",
        value:
          "Senior Product Designer at Northstar Labs. Led mobile redesign initiatives, shipped a modular component library, and reduced handoff friction across design and engineering."
      }
    ]
  },
  {
    title: "Skills",
    icon: "bolt",
    fields: [
      {
        label: "Skill Tags",
        kind: "tag-list",
        value: [
          "Design Systems",
          "Mobile UX",
          "Prototyping",
          "Figma",
          "Accessibility",
          "UX Writing"
        ]
      }
    ]
  }
] as const;

export const mockResume = {
  name: "Alexander Thompson",
  title: "Senior Product Designer",
  contact: ["San Francisco, CA", "alex@meowfolio.design", "+1 (555) 000-0000"],
  summary:
    "Product designer focused on tactile interfaces, thoughtful systems, and expressive visual language for consumer tools.",
  experience: [
    {
      role: "Senior Product Designer",
      company: "Northstar Labs",
      period: "2021 - Present",
      bullets: [
        "Led the redesign of a mobile growth platform used by 3M+ monthly users.",
        "Built a shared component system that reduced UI inconsistency across 5 product teams.",
        "Improved task completion in onboarding flows by 21% through information architecture changes."
      ]
    },
    {
      role: "Product Designer",
      company: "Tideframe",
      period: "2018 - 2021",
      bullets: [
        "Created dashboard, reporting, and template workflows for early-career job seekers.",
        "Partnered with engineering to turn high-fidelity prototypes into reusable front-end patterns."
      ]
    }
  ],
  education: [
    {
      degree: "B.Des. in Interaction Design",
      school: "California Institute of Arts",
      period: "2014 - 2018"
    }
  ],
  skills: ["Design Systems", "UI Design", "Interaction Design", "Figma", "Research", "Accessibility"]
} as const;
