import type { FormValues } from '../config/fields';
import { isNotApplicable } from './validation';

/**
 * Deterministic, template-based introduction. Uses only what the employee wrote; never adds content.
 * Free text is only reshaped when that can be done reliably (short noun lists, clearly past-tense statements).
 * Anything else (first-person or sentence-like answers) is kept in the employee's own words under a short label,
 * so they can edit it by hand instead of the generator guessing.
 */

const TITLE_WORDS = new Set([
  'analyst', 'engineer', 'manager', 'developer', 'consultant', 'designer', 'architect', 'lead', 'director',
  'specialist', 'officer', 'scientist', 'administrator', 'executive', 'associate', 'coordinator', 'recruiter',
  'accountant', 'tester', 'programmer', 'strategist', 'advisor', 'adviser', 'producer', 'editor', 'researcher',
  'intern', 'trainee', 'supervisor', 'planner', 'auditor', 'technician', 'writer', 'marketer', 'owner',
]);

/** Irregular past-tense verbs that do not end in "-ed". Regular ones are detected by the "-ed" ending. */
const IRREGULAR_PAST = new Set([
  'led', 'built', 'ran', 'drove', 'spent', 'began', 'grew', 'won', 'wrote', 'taught', 'oversaw', 'set', 'made',
  'held', 'took', 'brought', 'worked',
]);

const FIRST_PERSON = /\b(i|i'm|i've|i'd|i'll|my|me|myself)\b/i;

const clean = (s: string) => s.trim().replace(/\s+/g, ' ').replace(/[\s.;,]+$/, '');

/** Returns the cleaned answer, or null when it is N/A or blank. */
function answer(raw: string): string | null {
  return raw.trim() === '' || isNotApplicable(raw) ? null : clean(raw);
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** Capitalises and terminates a kept-as-written answer. */
function sentence(text: string): string {
  const t = text.charAt(0).toUpperCase() + text.slice(1);
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/** True for a clause such as "Led a migration" or "previously worked in retail" (a past-tense statement). */
function isPastClause(clause: string): boolean {
  const word = clause
    .replace(/^i\s+/i, '')
    .replace(/^(previously|currently|also|recently)\s+/i, '')
    .split(/\s+/)[0]
    .toLowerCase();
  return IRREGULAR_PAST.has(word) || (word.length > 3 && word.endsWith('ed'));
}

/** Items of a short list such as "Python, SQL, cloud". Returns null for anything sentence-like. */
function listItems(text: string): string[] | null {
  if (FIRST_PERSON.test(text)) return null;
  const items = [...new Set(text.split(/[,;\n]+/).map(clean).filter(Boolean))];
  if (items.length === 0 || items.length > 10) return null;
  if (items.some((i) => i.split(' ').length > 6 || isPastClause(i) || /[.!?]/.test(i))) return null;
  return items;
}

/** Lower-cases the first item's plain sentence-initial capital (never touches acronyms such as SQL or names). */
function listText(items: string[]): string {
  const list = [...items];
  const plainCapital = /^[A-Z][a-z]+(\s|$)/.test(list[0]);
  const othersLower = list.length === 1 || list.slice(1).some((i) => /^[a-z]/.test(i));
  if (plainCapital && othersLower) list[0] = lowerFirst(list[0]);
  return joinList(list);
}

/** "Python, SQL, Cloud" -> "Python, SQL and Cloud". Sentence-like answers are kept as written. */
function toList(text: string): string {
  const items = [...new Set(text.split(/[,;\n]+/).map(clean).filter(Boolean))];
  return items.some((i) => i.length > 60) ? text : joinList(items);
}

/** "as a Data Analyst" for a single job title, otherwise "in Cloud Infrastructure". */
function rolePhrase(role: string): string {
  const words = role.split(' ');
  const last = words[words.length - 1].toLowerCase();
  const single = !/[,/&;]|\band\b/i.test(role);
  if (single && TITLE_WORDS.has(last)) {
    return `as ${/^[aeiou]/i.test(role) ? 'an' : 'a'} ${role}`;
  }
  return `in ${role}`;
}

function formatYears(n: number): string {
  const text = Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
  return `${text} ${n === 1 ? 'year' : 'years'}`;
}

function experienceSentence(
  name: string,
  yearsRaw: string,
  role: string | null,
  skills: string | null,
): string | null {
  const exp = answer(yearsRaw);
  const years = exp !== null ? Number(exp) : null;
  const rp = role ? ` ${rolePhrase(role)}` : '';
  let base: string | null = null;

  if (years !== null && Number.isFinite(years)) {
    base =
      years >= 1
        ? role
          ? `${name} brings ${formatYears(years)} of experience${rp}`
          : `${name} brings ${formatYears(years)} of professional experience`
        : `${name} is at the start of their professional career${rp}`;
  } else if (role) {
    base = `${name} works${rp}`;
  }

  if (base) return `${base}${skills ? `, with expertise in ${toList(skills)}` : ''}.`;
  return skills ? `${name}'s expertise includes ${toList(skills)}.` : null;
}

function projectsSentence(name: string, projects: string, hasPrior: boolean): string {
  const clauses = projects.split(/\s*[;.]\s*/).map(clean).filter(Boolean);
  // Every clause is a past-tense statement: "Led a migration; previously worked in retail" -> "They led a migration and ..."
  if (clauses.length > 0 && clauses.every((c) => isPastClause(c) && !FIRST_PERSON.test(c.replace(/^i\s+/i, '')))) {
    const actions = clauses.map((c) => lowerFirst(c.replace(/^i\s+/i, '')));
    return `${hasPrior ? 'They' : name} ${joinList(actions)}.`;
  }
  const items = listItems(projects);
  if (items) return `${hasPrior ? 'Their' : `${name}'s`} professional background includes ${listText(items)}.`;
  return `Professional background: ${sentence(projects)}`;
}

function strengthsSentence(name: string, strengths: string, hasPrior: boolean): string {
  const text = strengths
    .replace(/^my\s+(?:key\s+)?strengths?\s+(?:are|include|is)\s+/i, '')
    .replace(/^i\s+am\s+(?:very\s+|really\s+)?(?:good|great|strong|skilled|experienced)\s+(?:at|in|with)\s+/i, '');
  const items = listItems(text);
  if (items) return `${hasPrior ? 'Their' : `${name}'s`} professional strengths include ${listText(items)}.`;
  return `Professional strengths: ${sentence(strengths)}`;
}

function hobbiesSentence(name: string, hobbies: string | null): string | null {
  if (!hobbies) return null;
  const text = hobbies
    .replace(/^my\s+(?:hobbies|interests)\s+(?:are|include|is)\s+/i, '')
    .replace(/^i\s+(really\s+)?(like|love|enjoy)(\s+doing)?\s+(?!to\b)/i, '');
  const items = listItems(text);
  if (items) return `Outside of work, ${name} enjoys ${listText(items)}.`;
  return `Outside of work: ${sentence(hobbies)}`;
}

export function generateIntroduction(values: FormValues): string {
  const full = clean(values.fullName);
  const name = full.split(' ')[0] || full;
  const role = answer(values.role);
  const skills = answer(values.skills);
  const projects = answer(values.projects);
  const strengths = answer(values.strengths);

  const experience = experienceSentence(name, values.experience, role, skills);
  let hasPrior = !!experience;
  const professional: string[] = experience ? [experience] : [];
  if (projects) {
    professional.push(projectsSentence(name, projects, hasPrior));
    hasPrior = true;
  }
  if (strengths) professional.push(strengthsSentence(name, strengths, hasPrior));

  const paragraphs = [professional.join(' '), hobbiesSentence(name, answer(values.hobbies)) ?? ''].filter(Boolean);
  return paragraphs.length > 0 ? paragraphs.join('\n\n') : `${name} has joined the team.`;
}
