# New Joiner Welcome Studio – Stage 1

A React + TypeScript + Vite app where new joiners complete a questionnaire and upload a photograph.
Stage 1 covers the form, validation, photo upload, browser-local draft saving and a read-only summary.
There is no backend, database, authentication or AI; nothing is sent anywhere.

## Run locally

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal (normally http://localhost:5173).

Other commands: `npm run build` (type-check and production build), `npm run preview` (serve the build).

## Moving to another environment

Copy the folder without `node_modules` and `dist`, then run `npm install` again.

## Behaviour notes

- All eight fields are required. Text fields accept N/A variants (NA, N/A, n.a., Not Applicable, None, Nil, -, etc.).
  Original text is kept as typed and flagged as "not applicable" on the summary; the exception is **Full name**,
  which must be a real name. N/A is never accepted for the photograph.
- Photographs: JPG, JPEG, PNG or WebP up to 5 MB, shown uncropped and unmodified.
- Introduction: after Continue, a deterministic template (no AI) builds an editable introduction from the answers. N/A answers and
  their sentences are omitted, no facts are added, and wording avoids pronouns. Edits survive navigating back to the form;
  Regenerate rebuilds the text. "Refine with AI" is intentionally disabled.
- Drafts: text answers are autosaved to this browser's `localStorage` (key `njws.draft.v1`). Photographs are never
  stored, so they must be uploaded again after a reload. If storage is blocked the app still works and the
  Save draft button is disabled.

## Structure

```
src/config/fields.ts      field definitions and labels
src/lib/validation.ts     N/A detection, field and photo validation (no UI)
src/lib/draft.ts          safe localStorage draft handling
src/hooks/                useQuestionnaire (form state), usePhoto (original file + preview URL)
src/lib/introduction.ts     deterministic introduction generator
src/components/           TextField, PhotoUpload, PhotoPreview, Summary, IntroductionEditor
```
