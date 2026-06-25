import { SECTIONS } from './sections';

/**
 * The left rail. Presentational: it just paints the outline and marks which
 * section is active (the parent computes that from scroll position). Each item is
 * a plain anchor, so it works without JS and smooth-scrolls via CSS.
 */
export function DocsSidebar({ active }: { active: string }) {
  const activeIndex = Math.max(
    0,
    SECTIONS.findIndex((s) => s.id === active),
  );

  return (
    <nav aria-label="White paper contents" className="flex flex-col gap-1 text-sm">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
        Contents
      </p>
      {SECTIONS.map((s, i) => {
        const isActive = s.id === active;
        const done = i < activeIndex;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-current={isActive ? 'true' : undefined}
            className={`group flex items-center gap-3 rounded px-2 py-1.5 transition-colors ${
              isActive ? 'bg-accent/10 text-ink font-medium' : 'text-muted hover:text-ink'
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-4 w-px shrink-0 transition-colors ${
                isActive ? 'bg-accent' : done ? 'bg-border' : 'bg-border/60'
              }`}
            />
            <span className="leading-tight">{s.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
