'use client';

import { useEffect, useState } from 'react';
import { DocsSidebar } from './DocsSidebar';
import { SECTIONS } from './sections';

/**
 * White-paper layout + scroll-spy. The sticky left rail shows the outline; as the
 * reader scrolls, an IntersectionObserver reports which section headings are on
 * screen and we highlight the top-most one. Why an observer rather than a scroll
 * listener: it fires only when a target crosses the viewport band, so it's far
 * cheaper than recomputing offsets on every scroll frame.
 *
 * The body is passed in as children (server-rendered static content); only the
 * highlight state lives on the client.
 */
export function WhitePaper({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(SECTIONS[0]?.id ?? '');

  useEffect(() => {
    const targets = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (targets.length === 0) return;

    // Track every section's visibility; the active one is the highest still in view.
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        const firstVisible = SECTIONS.find((s) => visible.has(s.id));
        if (firstVisible) setActive(firstVisible.id);
      },
      // Band near the top of the viewport, so a heading "activates" as it arrives.
      { rootMargin: '-10% 0px -70% 0px', threshold: 0 },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mx-auto flex max-w-6xl gap-12 px-6 py-12">
      <aside className="sticky top-24 hidden h-fit w-56 shrink-0 lg:block">
        <DocsSidebar active={active} />
      </aside>
      <article className="min-w-0 flex-1 space-y-20">{children}</article>
    </div>
  );
}
