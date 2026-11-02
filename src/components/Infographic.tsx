import PhotoFrame from './PhotoFrame';
import type { PhotoCrop } from '../lib/photoCrop';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import bloom2 from '../assets/organic-blue-two-tone.svg';
import bloom3 from '../assets/organic-blue-three-tone.svg';
import line from '../assets/organic-blue.svg';
import logoColor from '../assets/health-catalyst-horizontal-full-color.svg';
import logoWhite from '../assets/health-catalyst-horizontal-white.svg';

export type InfographicLayout = 'portrait' | 'landscape';
export type InfographicDesign = 'spotlight' | 'split' | 'journey';

export const DESIGNS: { id: InfographicDesign; label: string; note: string }[] = [
  { id: 'spotlight', label: 'Spotlight', note: 'Dark base, large centered photo' },
  { id: 'split', label: 'Split', note: 'Vibrant blue panel, bold name' },
  { id: 'journey', label: 'Journey', note: 'Light base with connecting line' },
];

interface Props {
  name: string;
  photoUrl: string;
  photoAr: number;
  crop: PhotoCrop;
  onCropChange?: (crop: PhotoCrop) => void;
  onFrameAspect?: (ar: number) => void;
  /** Reports the final text scale and whether the introduction still overflows its box. */
  onFit?: (result: { fit: number; overflow: boolean }) => void;
  text: string;
  layout: InfographicLayout;
  design: InfographicDesign;
  /** Thumbnail mode: no warnings, hidden from assistive technology. */
  mini?: boolean;
}

/** Shrinks (or grows) a CSS scale variable until the element's content just fits. Returns true if it still overflows. */
function fitTo(el: HTMLElement, prop: string, start: number, min: number): boolean {
  let fit = start;
  el.style.setProperty(prop, String(fit));
  const over = () => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
  while (over() && fit > min) {
    fit = Math.round((fit - 0.03) * 100) / 100;
    el.style.setProperty(prop, String(fit));
  }
  return over();
}

/** Long names start smaller; the fit loop then handles anything that is still too big. */
const nameTier = (name: string) => (name.length <= 20 ? 1 : name.length <= 32 ? 0.8 : 0.62);

/**
 * Three compositions built from approved HC brand assets. All sizes use container units (cqw),
 * so every design scales with the preview width and keeps its aspect ratio.
 */
export default function Infographic({ name, photoUrl, photoAr, crop, onCropChange, onFrameAspect, onFit, text, layout, design, mini }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [tooLong, setTooLong] = useState(false);

  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() => live && setFontsReady(true));
    return () => {
      live = false;
    };
  }, []);

  useLayoutEffect(() => {
    const title = titleRef.current;
    if (title) {
      // Names wrap only between words; a single very long word shrinks first and is split only as a last resort.
      const nameEl = title.querySelector<HTMLElement>('.ig-name');
      if (nameEl) nameEl.style.overflowWrap = 'normal';
      if (fitTo(title, '--nfit', 1, 0.4) && nameEl) {
        nameEl.style.overflowWrap = 'anywhere';
        fitTo(title, '--nfit', 1, 0.4);
      }
    }
    // Short introductions may grow up to 1.5x so the box is filled; long ones shrink down to 0.5x.
    const body = bodyRef.current;
    if (body) {
      const overflow = fitTo(body, '--fit', 1.5, 0.5);
      setTooLong(overflow);
      onFit?.({ fit: Number(body.style.getPropertyValue('--fit')), overflow });
    }
  }, [text, name, layout, design, fontsReady]);

  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim() !== '');
  const dark = design === 'spotlight';

  return (
    <>
      <div className={`ig-wrap ig-${layout}`} aria-hidden={mini || undefined}>
        <div
          className={`ig-stage ig-d-${design}`}
          role={mini ? undefined : 'img'}
          aria-label={mini ? undefined : `Welcome infographic for ${name}`}
        >
          <div className="ig-deco">
            <div className="ig-band" />
            <img className="ig-bloom" src={dark ? bloom3 : bloom2} alt="" />
          </div>
          {design === 'journey' && (
            <>
              <div className="ig-spine" />
              <img className="ig-line" src={line} alt="" />
            </>
          )}
          <img className="ig-logo" src={dark ? logoWhite : logoColor} alt={mini ? '' : 'Health Catalyst'} />
          <PhotoFrame
            src={photoUrl}
            imgAr={photoAr}
            crop={crop}
            onCropChange={mini ? undefined : onCropChange}
            onFrameAspect={mini ? undefined : onFrameAspect}
          />
          <div className="ig-title" ref={titleRef} style={{ ['--tier' as string]: nameTier(name) }}>
            <p className="ig-kicker">Welcome to the team</p>
            <h3 className="ig-name">{name}</h3>
          </div>
          <div className="ig-body" ref={bodyRef}>
            {paragraphs.map((p, i) => (
              <p key={i} className={/^outside (of )?work/i.test(p.trim()) ? 'ig-personal' : undefined}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
      {tooLong && !mini && (
        <p className="error" role="alert">
          The introduction is too long for this design to show at a comfortable size. Shorten it on the review page,
          or try another design.
        </p>
      )}
    </>
  );
}
