export function EditorTabs() {
  const tabs = [
    { label: "Content", icon: "edit_note", active: true },
    { label: "Templates", icon: "dashboard", active: false },
    { label: "Design", icon: "palette", active: false }
  ];

  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-1.5">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          type="button"
          className={
            tab.active
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
