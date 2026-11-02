import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EMPTY_VALUES, TEXT_FIELDS, type FormValues, type TextFieldKey } from '../config/fields';
import { clearDraft, isDraftStorageAvailable, loadDraft, saveDraft } from '../lib/draft';
import { countCompleted, validateForm, type Errors } from '../lib/validation';

export type DraftNotice = { kind: 'ok' | 'error'; text: string } | null;

function timeLabel(iso: string | Date): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Form state, validation and draft handling. Contains no markup. */
export function useQuestionnaire(hasPhoto: boolean) {
  const storageAvailable = useMemo(() => isDraftStorageAvailable(), []);
  const initialDraft = useMemo(() => loadDraft(), []);
  const [values, setValues] = useState<FormValues>(initialDraft?.values ?? EMPTY_VALUES);
  const [touched, setTouched] = useState<Partial<Record<TextFieldKey, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [restored, setRestored] = useState<boolean>(
    !!initialDraft && TEXT_FIELDS.some((f) => initialDraft.values[f.key].trim() !== ''),
  );
  const [notice, setNotice] = useState<DraftNotice>(null);
  const dirty = useRef(false);

  // Autosave text answers shortly after the employee stops typing.
  useEffect(() => {
    if (!storageAvailable || !dirty.current) return;
    const t = window.setTimeout(() => {
      const saved = saveDraft(values);
      setNotice(saved ? { kind: 'ok', text: `Draft saved at ${timeLabel(saved.savedAt)}` } : null);
    }, 600);
    return () => window.clearTimeout(t);
  }, [values, storageAvailable]);

  const setValue = useCallback((key: TextFieldKey, value: string) => {
    dirty.current = true;
    setValues((v) => ({ ...v, [key]: value }));
  }, []);

  const markTouched = useCallback((key: TextFieldKey) => setTouched((t) => ({ ...t, [key]: true })), []);

  const allErrors: Errors = useMemo(() => validateForm(values, hasPhoto), [values, hasPhoto]);

  const visibleErrors: Errors = useMemo(() => {
    const out: Errors = {};
    for (const { key } of TEXT_FIELDS) {
      if ((touched[key] || submitAttempted) && allErrors[key]) out[key] = allErrors[key];
    }
    if (submitAttempted && allErrors.photo) out.photo = allErrors.photo;
    return out;
  }, [allErrors, touched, submitAttempted]);

  const saveNow = useCallback(() => {
    const saved = saveDraft(values);
    setNotice(
      saved
        ? { kind: 'ok', text: `Draft saved at ${timeLabel(saved.savedAt)}. Your photograph is not saved.` }
        : { kind: 'error', text: 'Your draft could not be saved in this browser.' },
    );
  }, [values]);

  /** Returns true when valid; otherwise reveals all errors and focuses the first invalid field. */
  const validateForContinue = useCallback((): boolean => {
    setSubmitAttempted(true);
    const order = [...TEXT_FIELDS.map((f) => f.key), 'photo'] as const;
    const first = order.find((k) => allErrors[k]);
    if (first) {
      requestAnimationFrame(() => {
        const el = document.getElementById(first === 'photo' ? 'photo-input' : `input-${first}`);
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        el?.focus({ preventScroll: true });
      });
      return false;
    }
    return true;
  }, [allErrors]);

  const discardDraft = useCallback(() => {
    clearDraft();
    dirty.current = false;
    setValues(EMPTY_VALUES);
    setTouched({});
    setSubmitAttempted(false);
    setRestored(false);
    setNotice(null);
  }, []);

  return {
    values,
    setValue,
    markTouched,
    errors: visibleErrors,
    completed: countCompleted(values, hasPhoto),
    storageAvailable,
    restored,
    dismissRestored: () => setRestored(false),
    notice,
    saveNow,
    validateForContinue,
    discardDraft,
  };
}
