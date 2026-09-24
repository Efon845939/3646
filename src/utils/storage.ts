// localStorage can throw (private mode, blocked site data, quota), so every access is guarded
// and callers always get a usable fallback instead of a crashed render.

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the in-memory React state still works for this session.
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}

export const scoutNotesKey = (teamNumber: number) => `scout_notes_${teamNumber}`;

export function readScoutNotes(teamNumber: number): string {
  return readStorage(scoutNotesKey(teamNumber)) || '';
}
