import { useEffect, useRef, useState } from 'react';
import type { PhotoAsset } from '../hooks/usePhoto';
import type { PhotoCrop } from '../lib/photoCrop';
import {
  ExportError,
  MIN_READABLE_FIT,
  REFERENCE,
  ensureFonts,
  exportFileName,
  nextFrames,
  renderPng,
  startDownload,
} from '../lib/exportPng';
import Infographic, { DESIGNS, type InfographicDesign, type InfographicLayout } from './Infographic';

interface Props {
  name: string;
  photo: PhotoAsset;
  text: string;
  layout: InfographicLayout;
  design: InfographicDesign;
  crop: PhotoCrop;
  onBack: () => void;
}

type Status = { kind: 'idle' } | { kind: 'working' } | { kind: 'done' } | { kind: 'error'; message: string };

export default function FinalReview({ name, photo, text, layout, design, crop, onBack }: Props) {
  const exportRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<{ fit: number; overflow: boolean }>({ fit: 1, overflow: false });
  const blobUrl = useRef<{ url: string; blob: Blob } | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [tooLong, setTooLong] = useState(false);

  useEffect(
    () => () => {
      if (blobUrl.current) URL.revokeObjectURL(blobUrl.current.url);
    },
    [],
  );

  const designLabel = DESIGNS.find((d) => d.id === design)?.label ?? design;
  const ar = photo.width / photo.height;
  const ref = REFERENCE[layout];
  const fileName = exportFileName(name);

  const run = async (reuse: boolean) => {
    setStatus({ kind: 'working' });
    try {
      let current = reuse ? blobUrl.current : null;
      if (!current) {
        const stage = exportRef.current?.querySelector<HTMLElement>('.ig-stage');
        if (!stage) throw new ExportError('The infographic is not ready to export. Please try again.');
        // Wait until fonts are loaded and the hidden full-size copy has fitted its text.
        await ensureFonts();
        await nextFrames();
        const { fit, overflow } = fitRef.current;
        if (overflow || fit < MIN_READABLE_FIT) {
          throw new ExportError(
            'Your introduction is too long to fit this design at a readable size, so the PNG was not created. Go back and shorten the introduction, or choose a different design or orientation.',
          );
        }
        const blob = await renderPng(stage, layout);
        if (blobUrl.current) URL.revokeObjectURL(blobUrl.current.url);
        current = { url: URL.createObjectURL(blob), blob };
        blobUrl.current = current;
      }
      startDownload(current.url, fileName);
      setStatus({ kind: 'done' });
    } catch (e) {
      setStatus({
        kind: 'error',
        message: e instanceof ExportError ? e.message : 'Something went wrong while creating the PNG. Please try again.',
      });
    }
  };

  const working = status.kind === 'working';

  return (
    <section className="card" aria-labelledby="review-title">
      <h2 id="review-title">Final review</h2>
      <p className="intro">
        Check everything below. Nothing is sent anywhere: confirming only creates a PNG on this device.
      </p>

      <dl className="review-list">
        <div><dt>Design</dt><dd>{designLabel}</dd></div>
        <div><dt>Orientation</dt><dd>{layout === 'portrait' ? 'Portrait' : 'Landscape'}</dd></div>
        <div><dt>Name</dt><dd>{name}</dd></div>
        <div>
          <dt>Introduction</dt>
          <dd className="review-intro">{text}</dd>
        </div>
      </dl>

      <Infographic name={name} photoUrl={photo.previewUrl} photoAr={ar} crop={crop} text={text} layout={layout} design={design} />

      {/* Hidden full-size copy: the exact stage that is rasterised, free of any controls or borders. */}
      <div className="ig-export" ref={exportRef} style={{ width: ref.w }} aria-hidden="true">
        <Infographic
          mini
          name={name}
          photoUrl={photo.previewUrl}
          photoAr={ar}
          crop={crop}
          text={text}
          layout={layout}
          design={design}
          onFit={(r) => {
            fitRef.current = r;
            setTooLong(r.overflow || r.fit < MIN_READABLE_FIT);
          }}
        />
      </div>

      {tooLong && status.kind !== 'error' && (
        <p className="error" role="alert">
          This introduction is too long for this design at a readable size, so export is blocked. Go back and shorten
          it, or choose another design or orientation.
        </p>
      )}
      {status.kind === 'error' && (
        <p className="error" role="alert">
          {status.message}
        </p>
      )}
      {status.kind === 'done' && (
        <div className="notice notice-ok" role="status">
          Your welcome infographic is ready. Please share the downloaded PNG with HR through your preferred
          communication channel.
        </div>
      )}

      <div className="actions">
        <button type="button" className="btn btn-secondary" onClick={onBack} disabled={working}>
          Back to Edit
        </button>
        {status.kind === 'done' ? (
          <button type="button" className="btn btn-primary" onClick={() => run(true)}>
            Download again
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => run(false)} disabled={working || tooLong}>
            {working ? 'Creating PNG…' : status.kind === 'error' ? 'Try again' : 'Confirm and Download'}
          </button>
        )}
      </div>
    </section>
  );
}
