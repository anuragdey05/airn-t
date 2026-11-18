/**
 * Subtle tactile feedback on mobile browsers supporting the Vibration API.
 * Safe no-op on desktop / iOS Safari or when prefers-reduced-motion is active.
 */
export function triggerHaptic(pattern: number | number[] = 12): void {
  try {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore vibration errors on unsupported devices
  }
}

export function scrollToTop(): void {
  if (typeof window === 'undefined') return;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}
