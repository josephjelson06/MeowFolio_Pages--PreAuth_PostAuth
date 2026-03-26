const SCHEMA_OVERVIEW = `
{
  "header": {
    "name": null,
    "title": null,
    "email": null,
    "phone": null,
    "location": null,
    "linkedin": null,
    "github": null,
    "website": null,
    "portfolio": null
  },
  "summary": null,
  "skills": [],
  "education": [],
  "experience": [],
  "projects": [],
  "certifications": [],
  "awards": [],
  "leadership": [],
  "extracurricular": []
}
`.trim();

const EXAMPLE_ONE_INPUT = `
Jane Doe
Product Designer
jane@example.com | +1 555-0100 | Austin, TX
linkedin.com/in/janedoe | github.com/janedoe

Summary
Product designer with 5 years of experience designing SaaS workflows.

Skills
Figma, UX Research, Design Systems

Experience
Senior Product Designer, Acme Corp, Austin, TX, 2022-01 to Present
- Led redesign of onboarding flow, improving activation by 18%.
- Built component library adopted by 3 product squads.

Education
B.Des, Industrial Design, RISD, Providence, 2014, 2018

Certifications
- Google UX Certificate (2022)
`.trim();

const EXAMPLE_ONE_OUTPUT = {
  awards: [],
  certifications: [
    {
      date: "2022",
      description: "Google UX Certificate",
      link: null
    }
  ],
  education: [
    {
      degree: "B.Des",
      endYear: "2018",
      field: "Industrial Design",
      gpa: null,
      institution: "RISD",
      location: "Providence",
      startYear: "2014"
    }
  ],
  experience: [
    {
      bullets: [
        "Led redesign of onboarding flow, improving activation by 18%.",
        "Built component library adopted by 3 product squads."
      ],
      company: "Acme Corp",
      current: true,
      description: null,
      endDate: null,
      id: null,
      location: "Austin, TX",
      role: "Senior Product Designer",
      startDate: "2022-01"
    }
  ],
  extracurricular: [],
  header: {
    email: "jane@example.com",
    github: "github.com/janedoe",
    linkedin: "linkedin.com/in/janedoe",
    location: "Austin, TX",
    name: "Jane Doe",
    phone: "+1 555-0100",
    portfolio: null,
    title: "Product Designer",
    website: null
  },
  leadership: [],
  projects: [],
  skills: ["Figma", "UX Research", "Design Systems"],
  summary: "Product designer with 5 years of experience designing SaaS workflows."
} as const;

const EXAMPLE_TWO_INPUT = `
Michael Chen
Software Engineer
michael@example.com | Seattle, WA | michaelchen.dev

SUMMARY
Backend engineer focused on APIs, cloud platforms, and observability.

TECHNICAL SKILLS
Languages: Python, Go
Tools: Docker, Kubernetes, PostgreSQL

PROJECTS
Resume Formatter
- Built a FastAPI service for parsing resume documents.
- Used Docker to compile LaTeX into PDFs.
Technologies: Python, FastAPI, Docker

Leadership & Responsibilities
- Led a 10-member engineering club (2023)

Hackathons / Competitions
- Top 8 finalist, City AI Hackathon (2024)
`.trim();

const EXAMPLE_TWO_OUTPUT = {
  awards: [],
  certifications: [],
  education: [],
  experience: [],
  extracurricular: [
    {
      date: "2024",
      description: "Top 8 finalist, City AI Hackathon",
      link: null
    }
  ],
  header: {
    email: "michael@example.com",
    github: null,
    linkedin: null,
    location: "Seattle, WA",
    name: "Michael Chen",
    phone: null,
    portfolio: null,
    title: "Software Engineer",
    website: "michaelchen.dev"
  },
  leadership: [
    {
      date: "2023",
      description: "Led a 10-member engineering club",
      link: null
    }
  ],
  projects: [
    {
      bullets: [
        "Built a FastAPI service for parsing resume documents.",
        "Used Docker to compile LaTeX into PDFs."
      ],
      description: null,
      endDate: null,
      link: null,
      startDate: null,
      technologies: ["Python", "FastAPI", "Docker"],
      title: "Resume Formatter"
    }
  ],
  skills: [
    {
      category: "Languages",
      items: ["Python", "Go"]
    },
    {
      category: "Tools",
      items: ["Docker", "Kubernetes", "PostgreSQL"]
    }
  ],
  summary: "Backend engineer focused on APIs, cloud platforms, and observability."
} as const;

const SYSTEM_PROMPT = `
You are a structured resume parser.
Return only valid JSON.
Do not wrap JSON in markdown.
Do not add explanations, commentary, or extra keys.
Preserve facts from the source resume only.
Do not invent companies, titles, dates, metrics, links, schools, or skills.
If data is missing, use null for single values and [] for arrays.
Resume section order in source text can vary; detect by meaning, not by position.

Allowed sections only:
1) header
2) summary
3) skills
4) education
5) experience
6) projects
7) certifications
8) awards
9) leadership
10) extracurricular

Section mapping rules:
- "Profile", "Objective", "About" -> summary
- "Internships", "Work History", "Experience" -> experience
- "Technical Skills", "Core Competencies" -> skills
- "Achievements", "Honors" -> awards
- "Leadership", "Roles & Responsibilities" -> leadership
- "Extracurricular", "Volunteer Work", "Activities", "Participations", "Hackathons", "Competitions", "Open Source Contributions" -> extracurricular

Skills rules:
- Skills can be either a flat array of strings, or grouped as objects with { "category": "...", "items": ["..."] }.
- Do not mix grouped and flat skills in the same output unless the source truly requires it.

Compact sections rules:
- certifications, awards, leadership, and extracurricular must use items shaped like { "description": "...", "date": "...", "link": "..." }.
- Keep descriptions concise and one-line where possible.

Experience rules:
- Include role, company, location, startDate, endDate, current, description, and bullets when available.
- Use bullets when the source resume provides achievement bullets.

Project rules:
- Include startDate and endDate when available.
- Include technologies when explicitly present or clearly inferable from the project block.
- If bullets are present, keep description null unless there is standalone narrative text.

Ignore publications and unsupported custom sections.

The JSON must match this schema shape exactly:
`.trim();

function stringifyExample(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function buildResumeParsePrompt(rawText: string) {
  return {
    system: `${SYSTEM_PROMPT}\n${SCHEMA_OVERVIEW}`,
    user: `
Parse the following resume text into JSON.
Return JSON only.

Schema:
${SCHEMA_OVERVIEW}

Example 1 input:
${EXAMPLE_ONE_INPUT}

Example 1 output:
${stringifyExample(EXAMPLE_ONE_OUTPUT)}

Example 2 input:
${EXAMPLE_TWO_INPUT}

Example 2 output:
${stringifyExample(EXAMPLE_TWO_OUTPUT)}

Resume text:
${rawText}
`.trim()
  };
}

export function buildResumeRepairPrompt(rawText: string, previousOutput: string, validationError: string) {
  return {
    system: `${SYSTEM_PROMPT}\n${SCHEMA_OVERVIEW}`,
    user: `
The previous resume JSON was invalid.
Fix it so it matches the schema exactly and return JSON only.

Schema:
${SCHEMA_OVERVIEW}

Validation error:
${validationError}

Original resume text:
${rawText}

Previous output:
${previousOutput}
`.trim()
  };
}
