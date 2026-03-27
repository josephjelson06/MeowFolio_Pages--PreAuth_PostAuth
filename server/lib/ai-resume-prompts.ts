const SCHEMA_OVERVIEW = `
{
  "header": {
    "name": null,
    "role": null,
    "phone": null,
    "email": null,
    "address": null,
    "github": { "url": null, "displayMode": "plain-url", "displayText": null },
    "linkedin": { "url": null, "displayMode": "plain-url", "displayText": null },
    "website": { "url": null, "displayMode": "plain-url", "displayText": null }
  },
  "summary": {
    "mode": "professional-summary",
    "content": null
  },
  "education": [],
  "skills": {
    "mode": "csv",
    "items": [],
    "groups": []
  },
  "experience": [],
  "projects": [],
  "certifications": [],
  "leadership": { "label": "Leaderships", "entries": [] },
  "achievements": { "label": "Achievements", "entries": [] },
  "competitions": { "label": "Competitions", "entries": [] },
  "extracurricular": { "label": "Extra-Curricular", "entries": [] },
  "publications": { "label": "Publications", "entries": [] },
  "openSource": { "label": "Open-Source", "entries": [] },
  "languages": {
    "mode": "csv",
    "items": [],
    "groups": []
  },
  "hobbies": {
    "mode": "csv",
    "items": [],
    "groups": []
  }
}
`.trim();

const EXAMPLE_INPUT = `
Akshata Patil
Fresher
Nagpur, Maharashtra | akshata@example.com | +91 98999 99999
linkedin.com/in/akshata | github.com/akshata

Career Objective
Aspiring AI engineer looking for an entry-level role where I can build real machine learning systems.

Education
B.Tech, Artificial Intelligence, St. Vincent Pallotti College of Engineering, Nagpur, 2023 - 2027, 8.7 CGPA
Class 12, PCM, St. Paul Junior College, Nagpur, 2021 - 2023, 92%

Skills
Programming Languages: Python, C++, SQL
Tools & Frameworks: PyTorch, OpenCV, FastAPI

Projects
Solar Panel Extraction Model
GitHub: github.com/akshata/solar-segmentation
Technologies: Python, PyTorch, OpenCV
- Built a segmentation model for solar panel extraction.
- Improved IoU by 14% over the baseline.

Certifications
Google Data Analytics Professional Certificate | Coursera | 2024

Languages
English: Fluent
Hindi: Native

Hobbies & Interests
Reading, Sketching, Hackathons
`.trim();

const EXAMPLE_OUTPUT = {
  achievements: { entries: [], label: "Achievements" },
  certifications: [
    {
      date: {
        endMonth: "",
        endYear: "",
        isOngoing: false,
        mode: "yyyy",
        startMonth: "",
        startYear: "2024"
      },
      description: "",
      issuer: "Coursera",
      link: { displayMode: "plain-url", displayText: null, url: null },
      title: "Google Data Analytics Professional Certificate"
    }
  ],
  competitions: { entries: [], label: "Competitions" },
  education: [
    {
      boardOrUniversity: "",
      date: {
        endMonth: "",
        endYear: "2027",
        isOngoing: false,
        mode: "yyyy-range",
        startMonth: "",
        startYear: "2023"
      },
      degree: "B.Tech",
      field: "Artificial Intelligence",
      institution: "St. Vincent Pallotti College of Engineering",
      level: "degree-diploma",
      location: "Nagpur",
      result: "8.7 CGPA",
      resultType: "cgpa-10"
    }
  ],
  experience: [],
  extracurricular: { entries: [], label: "Extra-Curricular" },
  header: {
    address: "Nagpur, Maharashtra",
    email: "akshata@example.com",
    github: { displayMode: "plain-url", displayText: null, url: "github.com/akshata" },
    linkedin: { displayMode: "plain-url", displayText: null, url: "linkedin.com/in/akshata" },
    name: "Akshata Patil",
    phone: "+91 98999 99999",
    role: "Fresher",
    website: { displayMode: "plain-url", displayText: null, url: null }
  },
  hobbies: {
    groups: [],
    items: ["Reading", "Sketching", "Hackathons"],
    mode: "csv"
  },
  languages: {
    groups: [],
    items: [
      { language: "English", proficiency: "fluent" },
      { language: "Hindi", proficiency: "native" }
    ],
    mode: "csv"
  },
  leadership: { entries: [], label: "Leaderships" },
  openSource: { entries: [], label: "Open-Source" },
  projects: [
    {
      date: {
        endMonth: "",
        endYear: "",
        isOngoing: false,
        mode: "mm-yyyy-range",
        startMonth: "",
        startYear: ""
      },
      description: {
        bullets: [
          "Built a segmentation model for solar panel extraction.",
          "Improved IoU by 14% over the baseline."
        ],
        mode: "bullets",
        paragraph: null
      },
      githubLink: {
        displayMode: "plain-url",
        displayText: null,
        url: "github.com/akshata/solar-segmentation"
      },
      liveLink: { displayMode: "plain-url", displayText: null, url: null },
      technologies: ["Python", "PyTorch", "OpenCV"],
      title: "Solar Panel Extraction Model"
    }
  ],
  publications: { entries: [], label: "Publications" },
  skills: {
    groups: [
      { groupLabel: "Programming Languages", items: ["Python", "C++", "SQL"] },
      { groupLabel: "Tools & Frameworks", items: ["PyTorch", "OpenCV", "FastAPI"] }
    ],
    items: [],
    mode: "grouped"
  },
  summary: {
    content: "Aspiring AI engineer looking for an entry-level role where I can build real machine learning systems.",
    mode: "career-objective"
  }
} as const;

const SYSTEM_PROMPT = `
You are a structured resume parser.
Return only valid JSON.
Do not wrap JSON in markdown.
Do not add commentary or extra keys.
Preserve facts from the source resume only.
If data is missing, use null for scalars and [] for arrays.
Resume sections can appear in any order.

Required section coverage:
1) header / personal details
2) career objective or professional summary
3) education
4) skills
5) experience / internships
6) projects
7) certifications
8) leaderships
9) achievements
10) competitions
11) extra-curricular
12) publications
13) open-source
14) languages known
15) hobbies & interests

Mapping rules:
- "Objective", "Profile", "Professional Summary", "Career Objective" -> summary
- "Experience", "Work Experience", "Internships" -> experience
- "Hackathons", "Contest", "Competitions" -> competitions
- "Awards", "Honors", "Achievements" -> achievements
- "Volunteer Work", "Activities", "Extra Curricular" -> extracurricular
- "Languages", "Languages Known" -> languages
- "Hobbies", "Interests" -> hobbies
- "Open Source Contributions" -> openSource

Field rules:
- Use structured link objects for github, linkedin, website, project links, and certificate links.
- Use structured date objects for date fields.
- Use description.mode = "bullets" when the source provides bullet points.
- Use description.mode = "paragraph" when the source is narrative text.
- For skills, languages, and hobbies choose mode "grouped" only when the source is clearly grouped.
- Keep section labels human-readable.

The JSON must match this schema exactly:
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

Example input:
${EXAMPLE_INPUT}

Example output:
${stringifyExample(EXAMPLE_OUTPUT)}

Resume text:
${rawText}
`.trim()
  };
}
