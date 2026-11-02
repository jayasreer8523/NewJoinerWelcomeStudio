import { useRef } from 'react';
import type { PhotoAsset } from '../hooks/usePhoto';
import { ACCEPTED_IMAGE_EXTENSIONS, MAX_PHOTO_BYTES } from '../lib/validation';
import PhotoPreview from './PhotoPreview';

interface Props {
  photo: PhotoAsset | null;
  error?: string;
  onSelect: (file: File | undefined) => void;
  onRemove: () => void;
}

export default function PhotoUpload({ photo, error, onSelect, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = 'photo-hint';
  const errorId = 'photo-error';

  return (
    <div className="field" id="field-photo">
      <label className="label" htmlFor="photo-input">
        Photograph <span className="req" aria-hidden="true">*</span>
        <span className="sr-only"> (required)</span>
      </label>
      <p className="hint" id={hintId}>
        A clear, front-facing photo works best. JPG, JPEG, PNG or WebP, up to {MAX_PHOTO_BYTES / 1024 / 1024} MB.
        Your photo is used exactly as uploaded.
      </p>

      <div className="photo-row">
        {photo ? (
          <PhotoPreview src={photo.previewUrl} alt="Preview of your uploaded photograph" />
        ) : (
          <div className="photo-frame photo-empty" aria-hidden="true">
            <span>No photo yet</span>
          </div>
        )}

        <div className="photo-actions">
          <input
            ref={inputRef}
            id="photo-input"
            className="sr-only-input"
            type="file"
            accept={ACCEPTED_IMAGE_EXTENSIONS.map((e) => `.${e}`).join(',') + ',image/jpeg,image/png,image/webp'}
            aria-required="true"
            aria-invalid={error ? true : undefined}
            aria-describedby={`${hintId}${error ? ` ${errorId}` : ''}`}
            onChange={(e) => {
              onSelect(e.target.files?.[0]);
              e.target.value = ''; // allow re-selecting the same file
            }}
          />
          <button type="button" className="btn btn-secondary" onClick={() => inputRef.current?.click()}>
            {photo ? 'Replace photograph' : 'Choose photograph'}
          </button>
          {photo && (
            <button type="button" className="btn btn-ghost" onClick={onRemove}>
              Remove
            </button>
          )}
          {photo && (
            <p className="file-meta">
              {photo.file.name} · {(photo.file.size / 1024).toFixed(0)} KB
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
