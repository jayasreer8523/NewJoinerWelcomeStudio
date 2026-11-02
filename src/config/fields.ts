export type TextFieldKey =
  | 'fullName'
  | 'experience'
  | 'role'
  | 'skills'
  | 'projects'
  | 'strengths'
  | 'hobbies';

export type FormValues = Record<TextFieldKey, string>;

export interface TextFieldConfig {
  key: TextFieldKey;
  label: string;
  hint?: string;
  placeholder: string;
  multiline: boolean;
  maxLength: number;
  /** Whether "N/A"-style answers are accepted for this field. */
  allowNA: boolean;
}

export const TEXT_FIELDS: TextFieldConfig[] = [
  {
    key: 'fullName',
    label: 'Full name',
    hint: 'As you would like it to appear on your welcome profile.',
    placeholder: 'e.g. Alex Morgan',
    multiline: false,
    maxLength: 80,
    allowNA: false,
  },
  {
    key: 'experience',
    label: 'Years of professional experience',
    hint: 'Enter a number such as 4 or 2.5. Use 0 if you are starting your career.',
    placeholder: 'e.g. 6',
    multiline: false,
    maxLength: 10,
    allowNA: true,
  },
  {
    key: 'role',
    label: 'Role / area of expertise',
    placeholder: 'e.g. Senior Data Analyst, Cloud Infrastructure',
    multiline: false,
    maxLength: 100,
    allowNA: true,
  },
  {
    key: 'skills',
    label: 'Key skills, technologies or areas of expertise',
    hint: 'Separate items with commas.',
    placeholder: 'e.g. Python, SQL, stakeholder management, financial modelling',
    multiline: true,
    maxLength: 500,
    allowNA: true,
  },
  {
    key: 'projects',
    label: 'Relevant projects, industries or previous experience',
    placeholder: 'e.g. Led a retail analytics migration; previously worked in healthcare and logistics.',
    multiline: true,
    maxLength: 600,
    allowNA: true,
  },
  {
    key: 'strengths',
    label: 'Professional interests or strengths',
    placeholder: 'e.g. Mentoring, simplifying complex problems, process improvement',
    multiline: true,
    maxLength: 500,
    allowNA: true,
  },
  {
    key: 'hobbies',
    label: 'Hobbies and interests outside work',
    placeholder: 'e.g. Trail running, photography, board games',
    multiline: true,
    maxLength: 500,
    allowNA: true,
  },
];

export const EMPTY_VALUES: FormValues = {
  fullName: '',
  experience: '',
  role: '',
  skills: '',
  projects: '',
  strengths: '',
  hobbies: '',
};

/** Total number of mandatory items (seven text fields + the photograph). */
export const TOTAL_REQUIRED = TEXT_FIELDS.length + 1;
