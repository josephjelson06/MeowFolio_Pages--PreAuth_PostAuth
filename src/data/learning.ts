export interface LearningSection {
  bullets?: string[];
  copy: string;
  title: string;
}

export interface LearningChallenge {
  copy: string;
  prompts: string[];
  title: string;
}

export interface LearningChapter {
  challenge: LearningChallenge;
  duration: string;
  focus: string;
  heroTitle: string;
  icon: string;
  id: string;
  order: number;
  sections: LearningSection[];
  summary: string;
  takeaway: string;
  tip: string;
  title: string;
}

export const learningChapters: LearningChapter[] = [
  {
    challenge: {
      copy: "Open any draft resume, give yourself six seconds, and see what your eye learns first.",
      prompts: [
        "Can you identify the target role immediately?",
        "Does the top third show who this person is and how to contact them?",
        "Is the strongest skill or area of proof obvious without searching?"
      ],
      title: "The 6-second audit"
    },
    duration: "5 min",
    focus: "Recruiter scan patterns",
    heroTitle: "First Impressions: The 6-Second Rule",
    icon: "mood",
    id: "chapter-1",
    order: 1,
    sections: [
      {
        copy: "Recruiters rarely read top-to-bottom on the first pass. They scan for anchors like name, role fit, recent experience, and obvious technical direction.",
        title: "Treat the first glance like a scan, not a reading session"
      },
      {
        bullets: [
          "Keep your name visually dominant.",
          "Place role, location, and contact links where they are easy to spot.",
          "Avoid dense top sections that hide your strongest signal."
        ],
        copy: "The header should answer who you are before the reader invests effort.",
        title: "Make the header do real work"
      },
      {
        copy: "White space is not wasted space. It helps a recruiter understand the page faster and makes confidence feel visible before they process every bullet.",
        title: "Use spacing to guide attention"
      }
    ],
    summary: "Why the first few seconds matter and how to make the top third of the resume land instantly.",
    takeaway: "Lead with role clarity, contact signals, and a headline that matches the job you want.",
    tip: "If the first screenful feels crowded, the page is asking the reader to do too much work.",
    title: "First Impressions"
  },
  {
    challenge: {
      copy: "Look at your section order and ask whether it reflects the job you want, not just the order you filled things in.",
      prompts: [
        "Is the most persuasive section too far down the page?",
        "Does the page switch rhythm or alignment midstream?",
        "Would a recruiter understand the structure in one glance?"
      ],
      title: "Re-order the story"
    },
    duration: "8 min",
    focus: "Layout structure",
    heroTitle: "The Layout Grid",
    icon: "grid_view",
    id: "chapter-2",
    order: 2,
    sections: [
      {
        copy: "Strong resumes feel stable. Good spacing, predictable section rhythm, and balanced density make even junior experience look more credible.",
        title: "Structure changes how quality feels"
      },
      {
        bullets: [
          "Summary or headline first when clarity is needed.",
          "Experience early for proven candidates.",
          "Projects or education earlier for student profiles."
        ],
        copy: "Section order should support the strongest proof you have right now.",
        title: "Choose section order intentionally"
      },
      {
        copy: "A grid is not about making the page rigid. It is about making alignment and spacing so consistent that the reader can relax into the content.",
        title: "Consistency is a readability feature"
      }
    ],
    summary: "How to organize sections so the resume feels stable, readable, and easy to skim.",
    takeaway: "Strong section order makes good experience easier to find before the reader gets tired.",
    tip: "If every section feels equally loud, none of them becomes memorable.",
    title: "The Layout Grid"
  },
  {
    challenge: {
      copy: "Rewrite two weak bullets using stronger verbs and measurable outcomes, then compare how much more decisive they feel.",
      prompts: [
        "Does the bullet start with a weak helper verb?",
        "Can you show impact, scope, speed, or outcome?",
        "Would the sentence still sound strong if read alone?"
      ],
      title: "Verb upgrade pass"
    },
    duration: "6 min",
    focus: "Action-led writing",
    heroTitle: "Action Verbs That Carry Weight",
    icon: "lightbulb",
    id: "chapter-3",
    order: 3,
    sections: [
      {
        copy: "Passive writing hides capability. Strong verbs help the same work feel more direct, accountable, and easier to understand.",
        title: "Responsibility is not impact"
      },
      {
        bullets: [
          "Built, launched, improved, reduced, automated, analyzed, led.",
          "Prefer verbs that imply motion and outcome.",
          "Avoid filler starts like helped with, worked on, responsible for."
        ],
        copy: "You do not need dramatic wording. You need language that makes ownership visible.",
        title: "Choose verbs that sound like decisions"
      },
      {
        copy: "A strong verb still needs evidence. Pair it with scale, result, or context so the bullet feels earned rather than inflated.",
        title: "Proof keeps strong wording honest"
      }
    ],
    summary: "Turn passive responsibility statements into active bullets with sharper verbs and clearer outcomes.",
    takeaway: "Good verbs help the same experience sound more decisive without exaggerating it.",
    tip: "If a bullet sounds generic, strengthen the verb first, then strengthen the evidence.",
    title: "Action Verbs"
  },
  {
    challenge: {
      copy: "Take one section of your resume and ask if a machine could read it cleanly without guessing what is a heading, bullet, or keyword.",
      prompts: [
        "Are headings obvious and consistent?",
        "Are keywords relevant instead of stuffed?",
        "Would a parser understand dates, roles, and company names?"
      ],
      title: "ATS clarity check"
    },
    duration: "4 min",
    focus: "ATS readiness",
    heroTitle: "Beating the ATS Without Gaming It",
    icon: "robot_2",
    id: "chapter-4",
    order: 4,
    sections: [
      {
        copy: "ATS systems reward clarity more than cleverness. Clean structure and role-relevant keywords matter more than trying to trick the parser.",
        title: "Readable beats flashy"
      },
      {
        bullets: [
          "Use standard section titles where possible.",
          "Keep dates, titles, and employers easy to parse.",
          "Match job-description language honestly when it reflects real experience."
        ],
        copy: "The safest ATS strategy is aligned wording plus reliable structure.",
        title: "Keyword alignment should feel natural"
      },
      {
        copy: "Random keyword stuffing can lower trust when a human reviewer finally reads the page. The best ATS resumes survive both machine parsing and human skepticism.",
        title: "Optimize for both machine and human readers"
      }
    ],
    summary: "A practical guide to making sure the resume is easy for applicant tracking systems to read.",
    takeaway: "Readable structure and honest keyword alignment beat stuffing the page with random terms.",
    tip: "If the keyword would feel embarrassing in conversation, it probably does not belong in the resume either.",
    title: "Beating the ATS"
  },
  {
    challenge: {
      copy: "Pick one project or role and ask what only you could say about it. That is usually the beginning of your differentiation.",
      prompts: [
        "Does the page sound like any other student resume?",
        "Do the projects show taste, initiative, or decision-making?",
        "Is there any evidence of craft beyond listing tools?"
      ],
      title: "Specificity pass"
    },
    duration: "10 min",
    focus: "Story and differentiation",
    heroTitle: "The Wow Factor",
    icon: "auto_awesome",
    id: "chapter-5",
    order: 5,
    sections: [
      {
        copy: "Strong resumes feel specific. They show what you chose to build, improve, or explore, instead of sounding like a template with names swapped in.",
        title: "Specific beats impressive-sounding"
      },
      {
        bullets: [
          "Show why a project existed, not just what stack it used.",
          "Mention the hard constraint, tradeoff, or user problem.",
          "Use one memorable proof point instead of five forgettable ones."
        ],
        copy: "Memorability usually comes from context, not adjectives.",
        title: "Differentiate with detail"
      },
      {
        copy: "Personality does not mean informality. It means the resume sounds like a real person with judgment, not a list of generic claims.",
        title: "Let the page feel human"
      }
    ],
    summary: "How to add personality, project proof, and distinctive evidence without making the document messy.",
    takeaway: "The strongest resumes feel specific and human, not generic and overproduced.",
    tip: "One unusual, well-explained project can do more for you than three interchangeable ones.",
    title: "The Wow Factor"
  },
  {
    challenge: {
      copy: "Do one final pass where you are only allowed to remove noise. Shorten, tighten, and normalize until the page feels calm.",
      prompts: [
        "Are there duplicate ideas across bullets?",
        "Do punctuation and tense stay consistent?",
        "Does every line still deserve the space it takes?"
      ],
      title: "Proofing sprint"
    },
    duration: "7 min",
    focus: "Proofing and polish",
    heroTitle: "Proofing and Polish",
    icon: "check_circle",
    id: "chapter-6",
    order: 6,
    sections: [
      {
        copy: "A polished resume signals care. Tiny inconsistencies make the page feel less trustworthy even when the content is good.",
        title: "Clean work feels safer to trust"
      },
      {
        bullets: [
          "Normalize tense and punctuation.",
          "Check date formatting across the full page.",
          "Remove bullets that repeat the same point in weaker words."
        ],
        copy: "The final pass is often subtraction, not addition.",
        title: "Polish by cutting friction"
      },
      {
        copy: "The reader should never trip over formatting while trying to understand what you did. Good polish protects your content from unnecessary skepticism.",
        title: "Smooth reading is part of credibility"
      }
    ],
    summary: "Final pass guidance for fixing density, awkward bullets, spacing issues, and accidental inconsistencies.",
    takeaway: "A clean final pass is often the difference between solid work and trustworthy work.",
    tip: "If you feel defensive about a line, it usually needs either proof or deletion.",
    title: "Proofing & Polish"
  },
  {
    challenge: {
      copy: "Map your next three applications and decide which version of the resume belongs to each one before you hit send.",
      prompts: [
        "Which version is for on-campus roles?",
        "Which version needs deeper tailoring for off-campus outreach?",
        "What is your follow-up plan after submission?"
      ],
      title: "Submission strategy map"
    },
    duration: "5 min",
    focus: "Application workflow",
    heroTitle: "Submission Strategy",
    icon: "send",
    id: "chapter-7",
    order: 7,
    sections: [
      {
        copy: "A strong resume still needs a system around it. Versioning, tailoring, and follow-up discipline matter more than most people expect.",
        title: "A workflow beats last-minute chaos"
      },
      {
        bullets: [
          "Keep a stable base version plus role-specific variants.",
          "Tailor safely instead of rewriting the whole page each time.",
          "Track where you applied and what changed between versions."
        ],
        copy: "Submission strategy is really a consistency strategy.",
        title: "Version with intent"
      },
      {
        copy: "The goal is not to apply everywhere faster. The goal is to apply in a way that keeps quality high and prevents self-sabotage.",
        title: "Protect your momentum"
      }
    ],
    summary: "How to manage versions, tailor safely, and follow up without losing track of your search.",
    takeaway: "The resume matters, but the system around it matters too.",
    tip: "A calm application system often helps more than one more frantic late-night rewrite.",
    title: "Submission Strategy"
  }
];

const learningChapterMap = new Map(learningChapters.map((chapter) => [chapter.id, chapter]));

export function getLearningChapterById(id: string) {
  return learningChapterMap.get(id);
}
