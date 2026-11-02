import { useCallback, useEffect, useState, type FormEvent } from 'react';
import logo from './assets/health-catalyst-horizontal-full-color.svg';
import FinalReview from './components/FinalReview';
import Infographic, { DESIGNS, type InfographicDesign, type InfographicLayout } from './components/Infographic';
import IntroductionEditor from './components/IntroductionEditor';
import PhotoUpload from './components/PhotoUpload';
import Summary from './components/Summary';
import TextField from './components/TextField';
import { TEXT_FIELDS, TOTAL_REQUIRED } from './config/fields';
import './ig.css';
import { DEFAULT_CROP, MAX_ZOOM, MIN_ZOOM, panRange, placement, type PhotoCrop } from './lib/photoCrop';
import { useIntroduction } from './hooks/useIntroduction';
import { usePhoto } from './hooks/usePhoto';
import { useQuestionnaire } from './hooks/useQuestionnaire';

export default function App() {
  const [view, setView] = useState<'form' | 'summary' | 'infographic' | 'review'>('form');
  const [layout, setLayout] = useState<InfographicLayout>('portrait');
  const [design, setDesign] = useState<InfographicDesign>('spotlight');
  const [crop, setCrop] = useState<PhotoCrop>(DEFAULT_CROP);
  const [frameAr, setFrameAr] = useState(1);
  const onFrameAspect = useCallback((ar: number) => setFrameAr(ar), []);
  const { photo, error: photoError, select, remove } = usePhoto();
  const form = useQuestionnaire(!!photo);
  const intro = useIntroduction();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (form.validateForContinue() && photo) {
      intro.prepare(form.values);
      setView('summary');
      window.scrollTo({ top: 0 });
    }
  };

  // A new or removed photograph starts from the default fitted crop; otherwise adjustments persist across pages.
  const photoUrl = photo?.previewUrl;
  useEffect(() => setCrop(DEFAULT_CROP), [photoUrl]);

  const photoMessage = photoError ?? form.errors.photo;

  return (
    <>
      <header className="app-header">
        <div className="container header-inner">
          <img className="logo" src={logo} alt="Health Catalyst" />
          <div>
            <h1>New Joiner Welcome Studio</h1>
            <p className="tagline">Tell us a little about yourself</p>
          </div>
        </div>
      </header>

      <main className="container">
        {view === 'review' && photo ? (
          <FinalReview
            name={form.values.fullName.trim()}
            photo={photo}
            text={intro.text}
            layout={layout}
            design={design}
            crop={crop}
            onBack={() => {
              setView('infographic');
              window.scrollTo({ top: 0 });
            }}
          />
        ) : view === 'infographic' && photo ? (
          <section className="card" aria-labelledby="ig-title">
            <h2 id="ig-title">Your welcome infographic</h2>
            <p className="intro">
              A preview built from your name, photograph and the introduction you edited. Nothing is sent anywhere.
            </p>
            <fieldset className="ig-layouts">
              <legend className="label">Layout</legend>
              {(['portrait', 'landscape'] as const).map((l) => (
                <label key={l} className="ig-radio">
                  <input type="radio" name="ig-layout" checked={layout === l} onChange={() => setLayout(l)} />{' '}
                  {l === 'portrait' ? 'Portrait' : 'Landscape'}
                </label>
              ))}
            </fieldset>
            <div className="ig-picker" role="group" aria-label="Choose a design">
              {DESIGNS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="ig-choice"
                  aria-pressed={design === d.id}
                  onClick={() => setDesign(d.id)}
                >
                  <Infographic
                    mini
                    name={form.values.fullName.trim()}
                    photoUrl={photo.previewUrl}
                    photoAr={photo.width / photo.height}
                    crop={crop}
                    text={intro.text}
                    layout={layout}
                    design={d.id}
                  />
                  <span className="ig-choice-label">{d.label}</span>
                  <span className="ig-choice-note">{d.note}</span>
                </button>
              ))}
            </div>
            {(() => {
              const imgAr = photo.width / photo.height;
              const view = placement(crop, imgAr, frameAr).crop;
              const range = panRange(view.zoom, imgAr, frameAr);
              return (
                <fieldset className="ig-adjust">
                  <legend>Adjust photograph</legend>
                  <div className="ig-adjust-grid">
                    <label>
                      Zoom
                      <input
                        type="range" min={MIN_ZOOM} max={MAX_ZOOM} step={0.01} value={view.zoom}
                        onChange={(e) => setCrop({ ...view, zoom: Number(e.target.value) })}
                      />
                    </label>
                    <label>
                      Left / right
                      <input
                        type="range" min={range.x[0]} max={range.x[1]} step={0.001} value={view.cx}
                        disabled={range.x[1] - range.x[0] < 0.001}
                        onChange={(e) => setCrop({ ...view, cx: Number(e.target.value) })}
                      />
                    </label>
                    <label>
                      Up / down
                      <input
                        type="range" min={range.y[0]} max={range.y[1]} step={0.001} value={view.cy}
                        disabled={range.y[1] - range.y[0] < 0.001}
                        onChange={(e) => setCrop({ ...view, cy: Number(e.target.value) })}
                      />
                    </label>
                    <button type="button" className="btn btn-secondary" onClick={() => setCrop(DEFAULT_CROP)}>
                      Reset photograph
                    </button>
                  </div>
                  <p className="hint">You can also drag the photograph in the preview. Your original image is never changed.</p>
                </fieldset>
              );
            })()}
            <Infographic
              name={form.values.fullName.trim()}
              photoUrl={photo.previewUrl}
              photoAr={photo.width / photo.height}
              crop={crop}
              onCropChange={setCrop}
              onFrameAspect={onFrameAspect}
              text={intro.text}
              layout={layout}
              design={design}
            />
            <div className="actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setView('summary');
                  window.scrollTo({ top: 0 });
                }}
              >
                Back to introduction
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setView('review');
                  window.scrollTo({ top: 0 });
                }}
              >
                Continue to final review
              </button>
            </div>
          </section>
        ) : view === 'summary' && photo ? (
          <Summary
            values={form.values}
            photo={photo}
            onPreview={() => {
              setView('infographic');
              window.scrollTo({ top: 0 });
            }}
            onBack={() => {
              setView('form');
              window.scrollTo({ top: 0 });
            }}
          >
            <IntroductionEditor
              text={intro.text}
              edited={intro.edited}
              outdated={intro.isOutdated(form.values)}
              onChange={intro.change}
              onRegenerate={() => intro.regenerate(form.values)}
              canSave={form.storageAvailable}
              onSave={() => intro.save(form.values)}
            />
          </Summary>
        ) : (
          <form className="card" onSubmit={handleSubmit} noValidate aria-labelledby="form-title">
            <h2 id="form-title">Welcome! Let&rsquo;s get to know you</h2>
            <p className="intro">
              Answer the questions below and upload a photograph. All fields marked{' '}
              <span className="req" aria-hidden="true">*</span>
              <span className="sr-only">with an asterisk</span> are required. If a text question does not apply
              to you, simply enter <strong>N/A</strong>.
            </p>

            <div className="notice notice-info" role="note">
              {form.storageAvailable ? (
                <>
                  Your text answers are saved as a draft <strong>in this browser only</strong>. Your photograph is
                  never saved, so if you return later you may need to upload it again.
                </>
              ) : (
                <>
                  Draft saving is not available in this browser, so your answers will be kept only while this page
                  stays open.
                </>
              )}
            </div>

            {form.restored && (
              <div className="notice notice-ok" role="status">
                <span>We restored your saved draft. Please upload your photograph again.</span>
                <span className="notice-actions">
                  <button type="button" className="link" onClick={() => {
                      form.discardDraft();
                      intro.clear();
                    }}>
                    Start over
                  </button>
                  <button type="button" className="link" onClick={form.dismissRestored}>
                    Dismiss
                  </button>
                </span>
              </div>
            )}

            <div className="progress" role="status" aria-live="polite">
              <div
                className="progress-bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={TOTAL_REQUIRED}
                aria-valuenow={form.completed}
                aria-label="Form completion"
              >
                <span style={{ width: `${(form.completed / TOTAL_REQUIRED) * 100}%` }} />
              </div>
              <span className="progress-text">
                {form.completed} of {TOTAL_REQUIRED} completed
              </span>
            </div>

            {TEXT_FIELDS.map((config) => (
              <TextField
                key={config.key}
                config={config}
                value={form.values[config.key]}
                error={form.errors[config.key]}
                onChange={(v) => form.setValue(config.key, v)}
                onBlur={() => form.markTouched(config.key)}
              />
            ))}

            <PhotoUpload photo={photo} error={photoMessage} onSelect={select} onRemove={remove} />

            <div className="actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={form.saveNow}
                disabled={!form.storageAvailable}
                title={form.storageAvailable ? undefined : 'Draft saving is unavailable in this browser'}
              >
                Save draft
              </button>
              <button type="submit" className="btn btn-primary">
                Continue
              </button>
            </div>
            {form.notice && (
              <p className={`draft-status ${form.notice.kind === 'error' ? 'error' : ''}`} role="status">
                {form.notice.text}
              </p>
            )}
          </form>
        )}
      </main>
    </>
  );
}
