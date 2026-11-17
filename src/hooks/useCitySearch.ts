import { useEffect, useRef, useState } from 'react';
import { searchCitiesWorldwide, type GeocodingResult } from '../lib/aqiService';

export function useCitySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settled, setSettled] = useState(false);
  const generation = useRef(0);
  const change = (value: string) => {
    generation.current++;
    setQuery(value); setResults([]); setError(''); setSettled(false);
    setLoading(value.trim().length >= 2);
  };
  useEffect(() => {
    const id = generation.current;
    if (query.trim().length < 2) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const found = await searchCitiesWorldwide(query, true);
        if (active && id === generation.current) setResults(found);
      } catch {
        if (active && id === generation.current) setError('City search failed. Edit your search to try again.');
      } finally {
        if (active && id === generation.current) { setLoading(false); setSettled(true); }
      }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query]);
  return { query, change, results, loading, message: error || (settled && !results.length ? 'No cities found. Try another name.' : '') };
}
