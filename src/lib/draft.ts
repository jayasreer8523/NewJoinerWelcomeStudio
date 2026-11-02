import { EMPTY_VALUES, TEXT_FIELDS, type FormValues } from '../config/fields';

const KEY = 'njws.draft.v1';

/** Employee-edited introduction, saved only when they choose to save it. */
export interface SavedIntroduction {
  text: string;
  /** Signature of the answers the text was generated from. */
  source: string;
}

export interface Draft {
  values: FormValues;
  savedAt: string;
  introduction?: SavedIntroduction;
}

/** Returns localStorage if usable, otherwise null (private mode, blocked storage, etc.). */
function getStorage(): Storage | null {
  try {
    const storage = window.localStorage;
    const probe = '__njws_probe__';
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export function isDraftStorageAvailable(): boolean {
  return getStorage() !== null;
}

/** Saves text answers only. Photographs are never written to browser storage. */
export function saveDraft(values: FormValues): Draft | null {
  const storage = getStorage();
  if (!storage) return null;
  // Autosaving answers must never overwrite or drop a previously saved introduction.
  const draft: Draft = { values, savedAt: new Date().toISOString(), introduction: loadDraft()?.introduction };
  try {
    storage.setItem(KEY, JSON.stringify(draft));
    return draft;
  } catch {
    return null;
  }
}

/** Explicit save of the introduction next to the current answers. Returns false if storage is unavailable. */
export function saveIntroduction(values: FormValues, introduction: SavedIntroduction): boolean {
  const storage = getStorage();
  if (!storage) return false;
  const draft: Draft = { values, savedAt: new Date().toISOString(), introduction };
  try {
    storage.setItem(KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function loadDraft(): Draft | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const parsed = JSON.parse(storage.getItem(KEY) ?? 'null');
    if (!parsed || typeof parsed !== 'object' || typeof parsed.values !== 'object' || !parsed.values) return null;
    const values = { ...EMPTY_VALUES };
    for (const { key } of TEXT_FIELDS) {
      if (typeof parsed.values[key] === 'string') values[key] = parsed.values[key];
    }
    const i = parsed.introduction;
    const introduction =
      i && typeof i.text === 'string' && typeof i.source === 'string' ? { text: i.text, source: i.source } : undefined;
    return { values, savedAt: String(parsed.savedAt ?? ''), introduction };
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    getStorage()?.removeItem(KEY);
  } catch {
    /* storage unavailable: nothing to clear */
  }
}
