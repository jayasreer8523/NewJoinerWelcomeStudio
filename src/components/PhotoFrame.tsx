import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { placement, type PhotoCrop } from '../lib/photoCrop';

interface Props {
  src: string;
  /** Natural width / height of the original image. */
  imgAr: number;
  crop: PhotoCrop;
  /** When given, the photo can be dragged to reposition it. */
  onCropChange?: (crop: PhotoCrop) => void;
  /** Reports the frame's aspect ratio (width / height) whenever it changes. */
  onFrameAspect?: (ar: number) => void;
}

/** The one place a photograph is drawn, used by all infographic designs. */
export default function PhotoFrame({ src, imgAr, crop, onCropChange, onFrameAspect }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [frameAr, setFrameAr] = useState(1);
  const drag = useRef<{ x: number; y: number; crop: PhotoCrop } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        const ar = el.clientWidth / el.clientHeight;
        setFrameAr(ar);
        onFrameAspect?.(ar);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onFrameAspect]);

  const p = placement(crop, imgAr, frameAr);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!onCropChange) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, crop: p.crop };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = ref.current;
    if (!d || !el || !onCropChange) return;
    onCropChange({
      zoom: d.crop.zoom,
      cx: d.crop.cx - (e.clientX - d.x) / el.clientWidth / p.size.w,
      cy: d.crop.cy - (e.clientY - d.y) / el.clientHeight / p.size.h,
    });
  };

  return (
    <div
      ref={ref}
      className={`ig-photo${onCropChange ? ' ig-photo-edit' : ''}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <img src={src} alt="" draggable={false} style={p.style} />
    </div>
  );
}
