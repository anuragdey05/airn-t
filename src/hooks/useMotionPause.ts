import { useCallback, useEffect, useState } from 'react';
import { safeStorage } from '../lib/safeStorage';

const KEY = 'airnt_motion_paused';

/**
 * User-controlled pause for the looping ambient animations (smog drift, smoke wisps, glowing tips).
 * Sets `data-motion="paused"` on <html>; index.css pauses every animation under it.
 */
export function useMotionPause(): [boolean, () => void] {
  const [paused, setPaused] = useState(() => safeStorage.get(KEY) === '1');

  useEffect(() => {
    const root = document.documentElement;
    if (paused) root.dataset.motion = 'paused';
    else delete root.dataset.motion;
    safeStorage.set(KEY, paused ? '1' : '0');
  }, [paused]);

  const toggle = useCallback(() => setPaused((value) => !value), []);
  return [paused, toggle];
}
