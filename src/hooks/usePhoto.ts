import { useCallback, useEffect, useRef, useState } from 'react';
import { validatePhotoFile } from '../lib/validation';

/**
 * The original, unmodified file plus an object URL for display.
 * Stage 2 can add crop/zoom/offset metadata alongside `file` without touching the original.
 */
export interface PhotoAsset {
  file: File;
  previewUrl: string;
  /** Natural pixel size of the original image. */
  width: number;
  height: number;
}

function decode(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export function usePhoto() {
  const [photo, setPhoto] = useState<PhotoAsset | null>(null);
  const [error, setError] = useState<string | undefined>();
  const currentUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    },
    [],
  );

  const select = useCallback(async (file: File | undefined) => {
    if (!file) return;
    const problem = validatePhotoFile(file);
    if (problem) {
      setError(problem); // keep any existing valid photo in place
      return;
    }
    const url = URL.createObjectURL(file);
    const size = await decode(url);
    if (!size || size.width === 0 || size.height === 0) {
      URL.revokeObjectURL(url);
      setError('This image could not be read. It may be corrupted. Please choose another file.');
      return;
    }
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    currentUrl.current = url;
    setError(undefined);
    setPhoto({ file, previewUrl: url, ...size });
  }, []);

  const remove = useCallback(() => {
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    currentUrl.current = null;
    setPhoto(null);
    setError(undefined);
  }, []);

  return { photo, error, select, remove };
}
