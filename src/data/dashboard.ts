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
    subtitle: "Tune the layout and resume content",
    icon: "edit_note",
    to: "/editor",
    tone: "primary"
  },
  {
    title: "Review ATS Score",
    subtitle: "See the split-screen report layout",
    icon: "analytics",
    to: "/ats",
    tone: "tertiary"
  },
  {
    title: "Review JD Match",
    subtitle: "Inspect keyword fit and report cards",
    icon: "query_stats",
    to: "/jd",
    tone: "secondary"
  }
] as const;
