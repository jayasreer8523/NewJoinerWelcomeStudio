import { useState } from 'react';

interface Props {
  text: string;
  edited: boolean;
  outdated: boolean;
  onChange: (text: string) => void;
  onRegenerate: () => void;
  canSave: boolean;
  onSave: () => boolean;
}

export default function IntroductionEditor({ text, edited, outdated, onChange, onRegenerate, canSave, onSave }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const handleRegenerate = () => {
    if (edited && !confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    onRegenerate();
  };

  return (
    <div className="intro-editor">
      <label className="label" htmlFor="introduction-text">
        Your introduction
      </label>
      <p className="hint" id="introduction-hint">
        Built from your answers using a fixed template. Please read it carefully and edit anything you like.
      </p>
      <textarea
        id="introduction-text"
        rows={10}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby="introduction-hint introduction-status"
      />
      <p className="hint" id="introduction-status" role="status">
        {text.trim() === ''
          ? 'The introduction is empty. Use Reset from Questionnaire to rebuild it from your answers.'
          : edited
            ? 'You have edited this introduction.'
            : 'Generated from your answers.'}
      </p>
      {outdated && (
        <div className="notice notice-info" role="note">
          Your answers changed after you edited this introduction. Your edits were kept. Select Reset from
          Questionnaire to rebuild it from the latest answers.
        </div>
      )}
      {confirming && (
        <div className="notice notice-ok" role="alertdialog" aria-label="Confirm reset">
          <span>Resetting will replace your edits with a new version built from your answers.</span>
          <span className="notice-actions">
            <button type="button" className="link" onClick={handleRegenerate}>
              Replace my edits
            </button>
            <button type="button" className="link" onClick={() => setConfirming(false)}>
              Keep editing
            </button>
          </span>
        </div>
      )}
      <div className="intro-actions">
        <button type="button" className="btn btn-secondary" onClick={handleRegenerate}>
          Reset from Questionnaire
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setSaveMsg(onSave() ? 'Introduction saved in this browser.' : 'Could not save in this browser.')}
          disabled={!canSave || text.trim() === ''}
        >
          Save introduction
        </button>
        <div className="refine">
          <button type="button" className="btn btn-secondary" disabled aria-describedby="refine-note">
            Improve My Introduction
          </button>
          <span className="refine-note" id="refine-note">
            Unavailable: no organization-approved AI service is connected. Your text is never sent anywhere, and
            no improvements are simulated.
          </span>
        </div>
      </div>
      {saveMsg && (
        <p className="hint" role="status">
          {saveMsg}
        </p>
      )}
    </div>
  );
}
