import type { ReactNode } from 'react';
import { TEXT_FIELDS, type FormValues } from '../config/fields';
import type { PhotoAsset } from '../hooks/usePhoto';
import { isNotApplicable } from '../lib/validation';
import PhotoPreview from './PhotoPreview';

interface Props {
  values: FormValues;
  photo: PhotoAsset;
  onBack: () => void;
  onPreview: () => void;
  children?: ReactNode;
}

export default function Summary({ values, photo, onBack, onPreview, children }: Props) {
  return (
    <section className="card" aria-labelledby="summary-title">
      <h2 id="summary-title">Review your introduction</h2>
      <p className="intro">
        Your details are complete. Review and edit your introduction below. Your answers are shown read-only underneath, and nothing has been submitted or sent anywhere.
      </p>

      {children}

      <h3 className="summary-heading">Your answers</h3>
      <div className="summary-grid">
        <div>
          <PhotoPreview src={photo.previewUrl} alt={`Photograph of ${values.fullName.trim()}`} />
        </div>
        <dl className="summary-list">
          {TEXT_FIELDS.map((f) => (
            <div key={f.key} className="summary-item">
              <dt>{f.label}</dt>
              <dd>
                {values[f.key].trim()}
                {isNotApplicable(values[f.key]) && <span className="badge">Marked as not applicable</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="actions">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Back to edit
        </button>
        <button type="button" className="btn btn-primary" onClick={onPreview}>
          Preview infographic
        </button>
      </div>
    </section>
  );
}
