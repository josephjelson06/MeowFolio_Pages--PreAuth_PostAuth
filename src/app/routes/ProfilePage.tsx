import { useEffect, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { Button } from "../../components/ui/Button";
import { useWorkspace } from "../workspace/WorkspaceContext";

interface AcademicProfile {
  branch: string;
  college: string;
  degree: string;
  year: string;
}

interface PersonalProfile {
  email: string;
  name: string;
  phone: string;
}

const inputClassName =
  "w-full rounded-[1rem] border-none bg-surface-container-highest px-6 py-4 font-body text-on-surface transition-colors focus:bg-primary-container/30 focus:outline-none";

export function ProfilePage() {
  const { resume, setResume } = useWorkspace();
  const [personal, setPersonal] = useState<PersonalProfile>({
    email: resume.header.email?.trim() || "",
    name: resume.header.name?.trim() || "",
    phone: resume.header.phone?.trim() || ""
  });
  const [academic, setAcademic] = useState<AcademicProfile>({
    branch: "Computer Science & Engineering",
    college: "National Institute of Technology",
    degree: "B.Tech",
    year: "4th Year"
  });

  useEffect(() => {
    setPersonal({
      email: resume.header.email?.trim() || "",
      name: resume.header.name?.trim() || "",
      phone: resume.header.phone?.trim() || ""
    });
  }, [resume.header.email, resume.header.name, resume.header.phone]);

  function handleCancel() {
    setPersonal({
      email: resume.header.email?.trim() || "",
      name: resume.header.name?.trim() || "",
      phone: resume.header.phone?.trim() || ""
    });
  }

  function handleSave() {
    setResume({
      ...resume,
      header: {
        ...resume.header,
        email: personal.email,
        name: personal.name,
        phone: personal.phone
      }
    });
  }

  const initials =
    (personal.name || "AT")
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "AT";

  return (
    <AppLayout contentClassName="px-4 py-12 md:px-8 lg:px-16">
      <div className="mx-auto w-full max-w-4xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-surface-container-lowest p-8 card-border shadow-tactile md:p-12">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-bl-full bg-primary-container/20" />

          <section className="mb-12 flex flex-col items-center gap-8 md:flex-row">
            <div className="group relative cursor-pointer">
              <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-surface-container-high bg-secondary-fixed shadow-inner md:h-40 md:w-40">
                <span className="font-headline text-4xl font-extrabold text-on-secondary-fixed md:text-5xl">{initials}</span>
              </div>
              <div className="absolute bottom-1 right-1 rounded-full border-4 border-surface-container-lowest bg-primary p-2 shadow-md transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-on-primary">edit</span>
              </div>
            </div>

            <div className="text-center md:text-left">
              <p className="mb-1 font-label text-xs font-bold uppercase tracking-[0.22em] text-primary">Pro Account</p>
              <h1 className="font-headline text-4xl font-extrabold text-on-surface md:text-5xl">
                {personal.name || "Alexander Thompson"}
              </h1>
              <div className="mt-2 flex items-center justify-center gap-2 text-on-surface-variant md:justify-start">
                <span className="material-symbols-outlined text-lg">calendar_today</span>
                <span>Member since August 2023</span>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <div className="mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">person</span>
              <h2 className="font-headline text-xl font-bold text-on-surface">Personal Information</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <label className="space-y-2">
                <span className="ml-2 font-label text-sm font-bold text-on-surface-variant">Full Name</span>
                <input
                  className={inputClassName}
                  value={personal.name}
                  onChange={(event) => setPersonal((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label className="space-y-2">
                <span className="ml-2 font-label text-sm font-bold text-on-surface-variant">Email</span>
                <input
                  className={inputClassName}
                  type="email"
                  value={personal.email}
                  onChange={(event) => setPersonal((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="ml-2 font-label text-sm font-bold text-on-surface-variant">Phone Number</span>
                <input
                  className={inputClassName}
                  value={personal.phone}
                  onChange={(event) => setPersonal((current) => ({ ...current, phone: event.target.value }))}
                />
              </label>
            </div>
          </section>

          <section className="mb-12 rounded-[1.5rem] bg-surface-container-low p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-tertiary">school</span>
              <h2 className="font-headline text-xl font-bold text-on-surface">Academic Details</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="ml-2 font-label text-sm font-bold text-on-surface-variant">College/University</span>
                <input
                  className="w-full rounded-[1rem] border-none bg-surface-container-lowest px-6 py-4 font-body text-on-surface shadow-sm transition-colors focus:bg-primary-container/30 focus:outline-none"
                  value={academic.college}
                  onChange={(event) => setAcademic((current) => ({ ...current, college: event.target.value }))}
                />
              </label>
              <label className="space-y-2">
                <span className="ml-2 font-label text-sm font-bold text-on-surface-variant">Degree</span>
                <input
                  className="w-full rounded-[1rem] border-none bg-surface-container-lowest px-6 py-4 font-body text-on-surface shadow-sm transition-colors focus:bg-primary-container/30 focus:outline-none"
                  value={academic.degree}
                  onChange={(event) => setAcademic((current) => ({ ...current, degree: event.target.value }))}
                />
              </label>
              <label className="space-y-2">
                <span className="ml-2 font-label text-sm font-bold text-on-surface-variant">Branch</span>
                <input
                  className="w-full rounded-[1rem] border-none bg-surface-container-lowest px-6 py-4 font-body text-on-surface shadow-sm transition-colors focus:bg-primary-container/30 focus:outline-none"
                  value={academic.branch}
                  onChange={(event) => setAcademic((current) => ({ ...current, branch: event.target.value }))}
                />
              </label>
              <label className="space-y-2">
                <span className="ml-2 font-label text-sm font-bold text-on-surface-variant">Current Year</span>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-[1rem] border-none bg-surface-container-lowest px-6 py-4 font-body text-on-surface shadow-sm transition-colors focus:bg-primary-container/30 focus:outline-none"
                    value={academic.year}
                    onChange={(event) => setAcademic((current) => ({ ...current, year: event.target.value }))}
                  >
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                    expand_more
                  </span>
                </div>
              </label>
            </div>
          </section>

          <section className="mb-12">
            <div className="mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant">settings</span>
              <h2 className="font-headline text-xl font-bold text-on-surface">Account Settings</h2>
            </div>
            <div className="flex flex-col gap-6">
              <div className="group flex items-center justify-between rounded-[1rem] bg-surface-container p-4 transition-colors hover:bg-surface-variant">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant">lock</span>
                  <span className="font-semibold text-on-surface">Change Password</span>
                </div>
                <span className="material-symbols-outlined text-outline transition-transform group-hover:translate-x-1">
                  chevron_right
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[1rem] bg-surface-container p-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
                  <span className="font-semibold text-on-surface">Notification Preferences</span>
                </div>
                <div className="h-7 w-12 rounded-full bg-primary" />
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] border-l-[8px] border-secondary bg-secondary-container p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-surface-container-lowest p-2 shadow-sm">
                <span className="material-symbols-outlined text-secondary">pets</span>
              </div>
              <div>
                <p className="font-headline font-bold text-on-secondary-container">Mochii&apos;s Tip</p>
                <p className="mt-1 text-sm leading-6 text-on-secondary-container/80">
                  Keeping your profile updated helps me find stronger keywords when you move from editing into ATS and JD review.
                </p>
              </div>
            </div>
          </section>

          <div className="mt-12 flex justify-end gap-4">
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
