import { TEXT_FIELDS, type FormValues, type TextFieldKey } from '../config/fields';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

/** Accepted spellings of "not applicable", compared after normalisation. */
const NA_VALUES = new Set([
  'na',
  'n a',
  'nil',
  'none',
  'nothing',
  'not applicable',
  'not available',
  'not any',
  'no',
  'nope',
]);

/**
 * True when the text is an "N/A"-style answer (NA, N/A, n.a., Not Applicable, None, -, ...).
 * The employee's original text is never altered; this only classifies it.
 */
export function isNotApplicable(raw: string): boolean {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === '') return false;
  if (/^[-–—.]+$/.test(trimmed)) return true;
  const squashed = trimmed.replace(/[^a-z]+/g, ' ').trim();
  return NA_VALUES.has(squashed);
}

export type Errors = Partial<Record<TextFieldKey | 'photo', string>>;

export function validateTextField(key: TextFieldKey, raw: string): string | undefined {
  const config = TEXT_FIELDS.find((f) => f.key === key)!;
  const value = raw.trim();

  if (value === '') {
    return config.allowNA
      ? 'This field is required. If it does not apply to you, enter N/A.'
      : 'This field is required.';
  }
  if (value.length > config.maxLength) {
    return `Please keep this under ${config.maxLength} characters.`;
  }

  if (isNotApplicable(value)) {
    return config.allowNA ? undefined : 'Please enter your full name.';
  }

  if (key === 'fullName' && value.length < 2) return 'Please enter your full name.';
  if (key === 'experience') {
    const valid = /^\d{1,2}(\.\d{1,2})?$/.test(value) && Number(value) <= 60;
    if (!valid) return 'Enter a number between 0 and 60 (for example 4 or 2.5), or N/A.';
  }
  if (key !== 'fullName' && key !== 'experience' && value.length < 2) {
    return 'Please add a little more detail, or enter N/A.';
  }
  return undefined;
}

export function validatePhotoFile(file: File): string | undefined {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const typeOk = ACCEPTED_IMAGE_TYPES.includes(file.type);
  const extOk = ACCEPTED_IMAGE_EXTENSIONS.includes(extension);
  if (!typeOk || !extOk) return 'Unsupported file type. Please upload a JPG, JPEG, PNG or WebP image.';
  if (file.size === 0) return 'This file is empty. Please choose another image.';
  if (file.size > MAX_PHOTO_BYTES) {
    return `This image is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please choose one under ${MAX_PHOTO_BYTES / 1024 / 1024} MB.`;
  }
  return undefined;
}

export function validateForm(values: FormValues, hasPhoto: boolean): Errors {
  const errors: Errors = {};
  for (const field of TEXT_FIELDS) {
    const message = validateTextField(field.key, values[field.key]);
    if (message) errors[field.key] = message;
  }
  if (!hasPhoto) errors.photo = 'A photograph is required. N/A cannot be used for the photograph.';
  return errors;
}

/** Number of mandatory items currently valid (used for the progress indicator). */
export function countCompleted(values: FormValues, hasPhoto: boolean): number {
  const text = TEXT_FIELDS.filter((f) => !validateTextField(f.key, values[f.key])).length;
  return text + (hasPhoto ? 1 : 0);
}
