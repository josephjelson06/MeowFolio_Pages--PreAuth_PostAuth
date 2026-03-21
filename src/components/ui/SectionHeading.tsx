interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <header className="space-y-2">
      {eyebrow ? (
        <p className="font-label text-xs font-bold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
      ) : null}
      <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">{title}</h2>
      {description ? <p className="max-w-2xl text-base text-on-surface-variant">{description}</p> : null}
    </header>
  );
}
