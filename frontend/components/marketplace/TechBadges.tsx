'use client';

export function TechBadges({ techs, max = 5 }: { techs: string[]; max?: number }) {
  if (!techs.length) return null;
  const shown = techs.slice(0, max);
  const extra = techs.length - max;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((t) => (
        <span key={t} className="badge-neutral text-[10px] px-2 py-0.5">{t}</span>
      ))}
      {extra > 0 && <span className="badge-neutral text-[10px] px-2 py-0.5">+{extra}</span>}
    </div>
  );
}
