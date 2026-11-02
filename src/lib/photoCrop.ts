/**
 * Resolution-independent photo crop, shared by every infographic design (and later by PNG export).
 * The original image is never modified: the crop is only a zoom plus the image point shown at the frame centre.
 * zoom 1 = the image just covers the frame (no empty bands, no distortion); cx/cy are 0..1 image coordinates.
 */
export interface PhotoCrop {
  zoom: number;
  cx: number;
  cy: number;
}

export const DEFAULT_CROP: PhotoCrop = { zoom: 1, cx: 0.5, cy: 0.5 };
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Image size as a multiple of the frame size (aspect ratio preserved, covers the frame at zoom 1). */
export function imageSize(zoom: number, imgAr: number, frameAr: number) {
  const base = imgAr > frameAr ? { w: imgAr / frameAr, h: 1 } : { w: 1, h: frameAr / imgAr };
  return { w: base.w * zoom, h: base.h * zoom };
}

/** Allowed centre range per axis so the image always covers the frame. */
export function panRange(zoom: number, imgAr: number, frameAr: number) {
  const { w, h } = imageSize(zoom, imgAr, frameAr);
  return { x: [0.5 / w, 1 - 0.5 / w] as const, y: [0.5 / h, 1 - 0.5 / h] as const };
}

/** Clamps the crop for this frame and returns CSS percentages (of the frame) for absolutely positioning the image. */
export function placement(crop: PhotoCrop, imgAr: number, frameAr: number) {
  const zoom = clamp(crop.zoom, MIN_ZOOM, MAX_ZOOM);
  const { w, h } = imageSize(zoom, imgAr, frameAr);
  const r = panRange(zoom, imgAr, frameAr);
  const cx = clamp(crop.cx, r.x[0], r.x[1]);
  const cy = clamp(crop.cy, r.y[0], r.y[1]);
  return {
    crop: { zoom, cx, cy },
    size: { w, h },
    style: {
      left: `${(0.5 - cx * w) * 100}%`,
      top: `${(0.5 - cy * h) * 100}%`,
      width: `${w * 100}%`,
      height: `${h * 100}%`,
    },
  };
}
