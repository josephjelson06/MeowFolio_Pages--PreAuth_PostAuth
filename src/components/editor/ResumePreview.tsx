import { mockResume } from "../../data/editor";
import { Chip } from "../ui/Chip";

export function ResumePreview() {
  return (
    <div className="rounded-[2rem] border border-outline-variant/20 bg-surface-container-low p-8 shadow-ambient">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-primary">Preview</p>
          <h2 className="mt-2 font-headline text-3xl font-extrabold text-on-surface">Resume Canvas</h2>
        </div>
        <Chip tone="mint">Live structure</Chip>
      </div>

      <div className="resume-paper mx-auto max-w-[720px] rounded-[1.75rem] p-10">
        <header className="border-b border-outline-variant/30 pb-6">
          <h1 className="font-headline text-4xl font-black uppercase tracking-[0.04em] text-on-surface">
            {mockResume.name}
          </h1>
          <p className="mt-2 text-lg font-semibold text-primary">{mockResume.title}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-on-surface-variant">
            {mockResume.contact.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </header>

        <section className="mt-6">
          <h2 className="font-label text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">Summary</h2>
          <p className="mt-3 text-sm leading-7 text-on-surface">{mockResume.summary}</p>
        </section>

        <section className="mt-8">
          <h2 className="font-label text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">Experience</h2>
          <div className="mt-4 space-y-5">
            {mockResume.experience.map((job) => (
              <article key={job.role}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-headline text-lg font-bold text-on-surface">{job.role}</h3>
                    <p className="text-sm font-semibold text-primary">{job.company}</p>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                    {job.period}
                  </span>
                </div>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-on-surface">
                  {job.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="font-label text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">
              Education
            </h2>
            <div className="mt-3 space-y-3 text-sm">
              {mockResume.education.map((item) => (
                <div key={item.school}>
                  <p className="font-semibold text-on-surface">{item.degree}</p>
                  <p className="text-on-surface-variant">
                    {item.school} - {item.period}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-label text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">Skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {mockResume.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
