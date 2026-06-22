'use client';

import { useState } from 'react';

/**
 * Accessible 1–5 star rating input. Hover previews a value; click commits it.
 * Implemented as a radiogroup so keyboard + screen-reader users can set a rating.
 */
export function StarPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div role="radiogroup" aria-label="Rating" className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          disabled={disabled}
          onClick={() => onChange(n)}
          onMouseEnter={() => !disabled && setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-7 h-7 transition-colors ${n <= shown ? 'text-accent' : 'text-border'}`}
          >
            <path d="M10 1.5l2.6 5.27 5.82.846-4.21 4.104.994 5.797L10 14.84l-5.204 2.737.994-5.797L1.58 7.616l5.82-.846L10 1.5z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
