import { identityFor } from '@/lib/identity';
import { MascotFigure } from './mascots';

/**
 * A small animal unique to each business that idles and wanders along its strip
 * while you read its reviews. Deterministic: same business, same creature and
 * colour, every visit. Decorative only (aria-hidden, no pointer events).
 */
export function Mascot({ slug, className = '' }: { slug: string; className?: string }) {
  const id = identityFor(slug);
  return (
    <div aria-hidden="true" className={`pointer-events-none select-none ${className}`}>
      {/* Outer track wanders side to side; inner bobs and tilts. */}
      <div className="animate-mascot-wander w-fit">
        <div className="animate-mascot-bob w-fit" style={{ color: id.ink }}>
          <MascotFigure kind={id.mascot} />
        </div>
      </div>
    </div>
  );
}
