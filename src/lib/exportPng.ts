import { toBlob } from 'html-to-image';
import type { InfographicLayout } from '../components/Infographic';

/** Reference resolution of each orientation (CSS px) and the export multiplier (final PNG = reference x 2). */
export const REFERENCE: Record<InfographicLayout, { w: number; h: number }> = {
  portrait: { w: 1080, h: 1350 },
  landscape: { w: 1620, h: 1080 },
};
export const EXPORT_SCALE = 2;

/** Below this scale the introduction would be too small to read comfortably, so export is blocked. */
export const MIN_READABLE_FIT = 0.6;

export class ExportError extends Error {}

const FONT_ERROR =
  'The Health Catalyst fonts did not finish loading, so the image cannot be created accurately. Check your connection and try again.';
const IMAGE_ERROR =
  'One of the images (your photograph or a logo) could not be rendered. Go back, re-upload the photograph if needed, and try again.';
const PNG_ERROR =
  'The PNG could not be generated in this browser. Try again, or use a recent version of Chrome, Edge or Firefox.';
const DOWNLOAD_ERROR = 'Your browser blocked the download. Allow downloads or pop-ups for this page and try again.';

/** Lets React and layout settle. Falls back to a timer because background tabs pause animation frames. */
export const nextFrames = () =>
  new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(finish));
    setTimeout(finish, 150);
  });

/** Loads every font face the infographic uses and confirms they are really available. */
export async function ensureFonts(): Promise<void> {
  const faces = ['800 24px Archivo', '500 24px Archivo', '400 16px "Open Sans"'];
  try {
    await Promise.all(faces.map((f) => document.fonts.load(f)));
    await document.fonts.ready;
  } catch {
    throw new ExportError(FONT_ERROR);
  }
  if (!faces.every((f) => document.fonts.check(f))) throw new ExportError(FONT_ERROR);
}

async function ensureImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  // Wait (up to 10 s) for any image still loading; decode() is avoided because it can stall for off-screen images.
  await Promise.all(
    imgs.map(
      (img) =>
        img.complete ||
        new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
          setTimeout(resolve, 10000);
        }),
    ),
  );
  if (imgs.some((img) => !img.complete || img.naturalWidth === 0)) throw new ExportError(IMAGE_ERROR);
}

/** Renders the (reference-sized) stage to a PNG blob and checks the result has the expected dimensions. */
export async function renderPng(stage: HTMLElement, layout: InfographicLayout): Promise<Blob> {
  const { w, h } = REFERENCE[layout];
  await ensureFonts();
  await ensureImages(stage);
  let blob: Blob | null;
  try {
    blob = await toBlob(stage, { pixelRatio: EXPORT_SCALE, width: w, height: h });
  } catch {
    throw new ExportError(PNG_ERROR);
  }
  if (!blob || blob.size === 0) throw new ExportError(PNG_ERROR);
  try {
    const bmp = await createImageBitmap(blob);
    const ok = bmp.width === w * EXPORT_SCALE && bmp.height === h * EXPORT_SCALE;
    bmp.close();
    if (!ok) throw new ExportError(PNG_ERROR);
  } catch (e) {
    throw e instanceof ExportError ? e : new ExportError(PNG_ERROR);
  }
  return blob;
}

/** Welcome_FirstName_LastName.png, keeping letters and digits only. */
export function exportFileName(fullName: string): string {
  const part = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '');
  const words = fullName.trim().split(/\s+/).map(part).filter(Boolean);
  const pieces = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return `Welcome_${pieces.length ? pieces.join('_') : 'Employee'}.png`;
}

/** Starts a browser download. The browser decides whether the file is actually saved. */
export function startDownload(url: string, fileName: string): void {
  const a = document.createElement('a');
  if ('download' in a) {
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }
  // Browsers without the download attribute: open the image so it can be saved manually.
  if (!window.open(url, '_blank')) throw new ExportError(DOWNLOAD_ERROR);
}
