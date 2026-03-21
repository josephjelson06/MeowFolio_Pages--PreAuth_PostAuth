interface MetricRingProps {
  accentColor: string;
  caption?: string;
  label: string;
  score: number;
  size?: number;
}

export function MetricRing({ accentColor, caption, label, score, size = 144 }: MetricRingProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          stroke="#efe9e2"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          stroke={accentColor}
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-headline text-4xl font-black text-on-surface">{score}%</span>
        <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
          {label}
        </span>
        {caption ? <span className="mt-1 text-xs text-on-surface-variant">{caption}</span> : null}
      </div>
    </div>
  );
}
