export const dashboardMetrics = [
  {
    label: "Average ATS Score",
    value: "82%",
    trend: "+4% this week",
    icon: "verified",
    tone: "tertiary"
  },
  {
    label: "Resume Strength",
    value: "89%",
    trend: "+3% this week",
    icon: "auto_fix_high",
    tone: "primary"
  },
  {
    label: "JD Match Success",
    value: "76%",
    trend: "+6% this week",
    icon: "match_word",
    tone: "secondary"
  }
] as const;

export const activeResumes = [
  {
    title: "Senior Product Designer",
    subtitle: "Last edited 2 hours ago",
    match: "94%"
  },
  {
    title: "Founding Product Designer",
    subtitle: "Updated yesterday",
    match: "88%"
  }
] as const;

export const quickActions = [
  {
    title: "Open Editor",
    subtitle: "Edit content, templates, and TeX output settings",
    icon: "edit_note",
    to: "/editor",
    tone: "primary"
  },
  {
    title: "Review ATS Score",
    subtitle: "Inspect content and render-readiness checks",
    icon: "analytics",
    to: "/ats",
    tone: "tertiary"
  },
  {
    title: "Review JD Match",
    subtitle: "Compare the live resume against the active JD",
    icon: "query_stats",
    to: "/jd",
    tone: "secondary"
  }
] as const;
