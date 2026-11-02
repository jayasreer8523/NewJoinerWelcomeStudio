import { useCallback, useMemo, useState } from 'react';
import type { FormValues } from '../config/fields';
import { loadDraft, saveIntroduction } from '../lib/draft';
import { generateIntroduction } from '../lib/introduction';

const signatureOf = (values: FormValues) => JSON.stringify(values);

/** Holds the editable introduction so it survives navigating between the form and the review page. */
export function useIntroduction() {
  // A previously saved introduction is restored as an edit, so it is never replaced automatically.
  const saved = useMemo(() => loadDraft()?.introduction, []);
  const [text, setText] = useState(saved?.text ?? '');
  const [edited, setEdited] = useState(!!saved);
  const [source, setSource] = useState<string | null>(saved?.source ?? null);

  /** Call when entering the review page. Never overwrites manual edits. */
  const prepare = useCallback(
    (values: FormValues) => {
      const signature = signatureOf(values);
      if (source === null || (!edited && source !== signature)) {
        setText(generateIntroduction(values));
        setSource(signature);
      }
    },
    [source, edited],
  );

  const regenerate = useCallback((values: FormValues) => {
    setText(generateIntroduction(values));
    setSource(signatureOf(values));
    setEdited(false);
  }, []);

  const change = useCallback((next: string) => {
    setText(next);
    setEdited(true);
  }, []);

  /** Explicit save only; returns false when browser storage is unavailable. */
  const save = useCallback(
    (values: FormValues) => saveIntroduction(values, { text, source: source ?? signatureOf(values) }),
    [text, source],
  );

  /** Forget the introduction (used when the employee discards the draft). */
  const clear = useCallback(() => {
    setText('');
    setEdited(false);
    setSource(null);
  }, []);

  /** True when the employee edited the text and then changed their answers afterwards. */
  const isOutdated = (values: FormValues) => edited && source !== null && source !== signatureOf(values);

  return { text, edited, prepare, regenerate, change, save, clear, isOutdated };
}
