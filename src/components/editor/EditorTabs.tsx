export type EditorTabId = "content" | "design" | "templates";

interface EditorTabsProps {
  activeTab: EditorTabId;
  onTabChange: (tab: EditorTabId) => void;
}

export function EditorTabs({ activeTab, onTabChange }: EditorTabsProps) {
  const tabs: Array<{ id: EditorTabId; icon: string; label: string }> = [
    { id: "content", icon: "edit_note", label: "Content" },
    { id: "templates", icon: "dashboard", label: "Templates" },
    { id: "design", icon: "palette", label: "Design" }
  ];

  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-1.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={
            activeTab === tab.id
              ? "rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-tactile-sm"
              : "rounded-xl px-5 py-2.5 text-sm font-bold text-on-surface-variant"
          }
        >
          <span className="inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
