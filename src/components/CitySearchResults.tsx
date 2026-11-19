import React from 'react';
import type { GeocodingResult } from '../lib/aqiService';

const focusResult = (listId: string, index: number) => {
  const items = document.getElementById(listId)?.querySelectorAll<HTMLButtonElement>('button');
  if (!items?.length) return;
  items[(index + items.length) % items.length].focus();
};

/**
 * Keyboard support for a search field that owns a CitySearchResults list:
 * ArrowDown moves into the results, Escape clears the search.
 */
export function onCitySearchKeyDown(
  event: React.KeyboardEvent<HTMLInputElement>,
  listId: string,
  onEscape: () => void
) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    focusResult(listId, 0);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    onEscape();
  }
}

export function CitySearchResults({
  id,
  results,
  onSelect,
  actionLabel,
  className,
  inputRef,
  onEscape,
}: {
  id: string;
  results: GeocodingResult[];
  onSelect: (geo: GeocodingResult) => void;
  actionLabel: string;
  className: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onEscape: () => void;
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (event.key === 'ArrowUp' && index <= 0) inputRef.current?.focus();
      else focusResult(id, index + (event.key === 'ArrowDown' ? 1 : -1));
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onEscape();
      inputRef.current?.focus();
    }
  };

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">
        {results.length > 0 ? `${results.length} ${results.length === 1 ? 'city' : 'cities'} found. Use the down arrow to browse.` : ''}
      </p>
      {results.length > 0 && (
        <div id={id} className={className} onKeyDown={handleKeyDown}>
          {results.map((geo) => (
            <button
              key={geo.id}
              type="button"
              onClick={() => onSelect(geo)}
              className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-stone-900 focus-visible:bg-stone-900 flex items-center justify-between gap-3 border-b border-stone-900 last:border-0 cursor-pointer"
            >
              <span className="min-w-0 break-words">
                <span className="font-semibold text-stone-100">{geo.name}</span>
                {geo.admin1 && <span className="text-stone-400">, {geo.admin1}</span>}
                <span className="text-stone-400"> — {geo.country}</span>
              </span>
              <span className="font-mono-code text-xs text-amber-400 shrink-0">{actionLabel} →</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
