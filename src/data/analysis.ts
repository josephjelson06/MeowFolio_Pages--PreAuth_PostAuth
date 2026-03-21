export const atsMock = {
  score: 82,
  rating: "Strong",
  categories: [
    { label: "Formatting", value: 88, tone: "tertiary" },
    { label: "Keywords", value: 76, tone: "primary" },
    { label: "Structure", value: 84, tone: "secondary" },
    { label: "Readability", value: 81, tone: "surface" }
  ],
  rules: ["Single-column sections", "Consistent headings", "No dense tables", "Readable spacing"],
  issues: [
    {
      severity: "Critical",
      title: "Project bullets feel generic",
      detail: "Add measurable outcomes so the resume reads stronger in both ATS and recruiter review."
    },
    {
      severity: "Moderate",
      title: "Role alignment can be tighter",
      detail: "Bring product strategy and systems language higher in the resume to match senior role expectations."
    },
    {
      severity: "Moderate",
      title: "Top section can be sharper",
      detail: "Condense the summary and surface strongest keywords above the fold."
    }
  ]
} as const;

export const jdMock = {
  score: 78,
  summaryTitle: "Good match with room to sharpen",
  summaryCopy:
    "The current resume aligns well with product design roles, but it can better emphasize strategy, system ownership, and experimentation language.",
  matched: 14,
  missing: 5,
  partial: 3,
  tags: ["Design Systems", "Product Thinking", "Cross-functional", "Mobile UX", "Research"],
  suggestions: [
    {
      keyword: "roadmapping",
      detail: "Add one bullet that shows influence on planning, sequencing, or product direction."
    },
    {
      keyword: "experimentation",
      detail: "Mention A/B testing, measurable hypothesis work, or iteration backed by results."
    },
    {
      keyword: "stakeholder alignment",
      detail: "Show how you aligned product, engineering, and design around shared outcomes."
    }
  ]
} as const;
