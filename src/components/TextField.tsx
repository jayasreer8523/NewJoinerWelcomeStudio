import type { TextFieldConfig } from '../config/fields';

interface Props {
  config: TextFieldConfig;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export default function TextField({ config, value, error, onChange, onBlur }: Props) {
  const id = `input-${config.key}`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [config.hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined;

  const shared = {
    id,
    name: config.key,
    value,
    placeholder: config.placeholder,
    maxLength: config.maxLength + 50, // soft limit: validation explains the real one
    'aria-required': true as const,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    onBlur,
  };

  return (
    <div className="field" id={`field-${config.key}`}>
      <label className="label" htmlFor={id}>
        {config.label} <span className="req" aria-hidden="true">*</span>
        <span className="sr-only"> (required)</span>
      </label>
      {config.hint && (
        <p className="hint" id={hintId}>
          {config.hint}
        </p>
      )}
      {config.multiline ? (
        <textarea {...shared} rows={3} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          {...shared}
          type="text"
          inputMode={config.key === 'experience' ? 'decimal' : undefined}
          autoComplete={config.key === 'fullName' ? 'name' : 'off'}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error && (
        <p className="error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
