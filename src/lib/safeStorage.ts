/**
 * localStorage access that never throws. Storage can be blocked (privacy modes, disabled site data),
 * and an unguarded read during render would blank the whole app.
 */
export const safeStorage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage unavailable: the value just won't persist */
    }
  },
};
