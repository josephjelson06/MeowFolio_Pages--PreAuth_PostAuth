# Action Plan And Log

## Current direction

- This project is being rebuilt around the core pages only:
  `landing`, `dashboard`, `editor`, `ats`, and `jd`.
- The resume path is TeX-first.
  Do not introduce HTML/CSS resume rendering as the main output path.
- `editor`, `ats`, and `jd` must preserve the split left-right workspace structure.
- Functionality comes before design polish.
- The current React token system remains the active styling foundation for now.

## What has been done so far

### 1. Initial HTML analysis

- The original `app/` HTML pages were analyzed.
- Key issues found:
  broken asset paths, inconsistent navigation, partial redirect wrappers, and uneven page quality.
- This confirmed that a clean React rebuild would be safer than trying to preserve every static page as-is.

### 2. Scope reduction

- The project scope was intentionally reduced from many static pages to the core set:
  `landing`, `dashboard`, `editor`, `ats`, and `jd`.
- The product structure decision was made to treat `landing` and `dashboard` as anchor pages.
- The split workspace layout for `editor`, `ats`, and `jd` was explicitly preserved as a non-negotiable structure.

### 3. Migration planning

- A migration blueprint was created in:
  `REACT_UI_MIGRATION.md`
- That plan established:
  the route map, shared layouts, UI primitives, and phased rebuild approach.

### 4. React app scaffold

- A new React + TypeScript + Vite + Tailwind app was scaffolded in this repo.
- Core project setup files were added, including:
  `package.json`
  `tailwind.config.ts`
  `.gitignore`
- The old `app/` folder was left untouched as reference material.

### 5. Routing and layouts

- Routes were created for:
  `/`
  `/dashboard`
  `/editor`
  `/ats`
  `/jd`
- Shared layout files were created:
  `src/components/layout/PublicLayout.tsx`
  `src/components/layout/AppLayout.tsx`
  `src/components/layout/WorkspaceSplitLayout.tsx`
  `src/components/layout/TopNav.tsx`

### 6. Core UI pages

- Initial UI-only versions of the five core pages were created:
  `src/app/routes/LandingPage.tsx`
  `src/app/routes/DashboardPage.tsx`
  `src/app/routes/EditorPage.tsx`
  `src/app/routes/AtsPage.tsx`
  `src/app/routes/JdPage.tsx`
- These were built as mock/presentational screens first, without business logic.

### 7. Design-system foundation

- A token-based styling system was created in:
  `src/styles/tokens.css`
  `src/styles/globals.css`
- The React app uses this token system as the active style foundation.
- `LandingPage` and `DashboardPage` were later refined to better reflect the desired structure and feel.

### 8. Style-system comparison

- A separate root `globals.css` from another project was analyzed.
- Decision made:
  do not apply it now.
- Its useful ideas can be revisited later, but the active source of truth remains:
  `src/styles/tokens.css`
  `src/styles/globals.css`
  `tailwind.config.ts`

### 9. Deferred style work captured

- The styling comparison and future unification note were added to:
  `LaterTasks.md`
- This preserves the idea for later without interrupting current implementation priorities.

### 10. TeX direction clarified

- The resume rendering direction was explicitly changed to:
  TeX-based resumes, not HTML/CSS resumes.
- This means the long-term pipeline is:
  structured resume data -> TeX -> compiled PDF

### 11. External reference project context absorbed

- The following files were reviewed:
  `Codebaseinfo`
  `repomix-output-josephjelson06-meow_match.git.md`
- The external project was read strictly as a schema reference.
- Relevant context extracted:
  canonical resume schema, section structure, item shapes, render-related schema fields, and normalization ideas.
- No design, styling, tech stack, routing, or implementation patterns were adopted from that project.

### 12. Phase 1 schema contract started

- A local schema contract was added in:
  `RESUME_SCHEMA_CONTRACT.md`
- First-class TypeScript types were added in:
  `src/types/resume.ts`
- The editor mock data was moved onto the canonical local resume model.
- The current preview now reads from canonical resume-shaped data instead of a custom one-off mock object.

### 13. Phase 2 editor wiring started

- `EditorPage` now owns live `ResumeData` state.
- `EditorSidebar` was converted from read-only mock fields into a controlled editor for the canonical schema.
- `ResumePreview` now renders from live shared state instead of the old static sample.
- The split editor layout was preserved while making the left and right panels actually connected.

## Rules to follow

### Product and build priority rules

- Functionality first.
- Get the product usable and public-facing as fast as possible.
- Design polish is important, but it comes after the core resume flow works.
- Assume low-cost or zero-cost constraints for both the product and its users.

### Resume rendering rules

- Use TeX as the real resume rendering path.
- Do not treat HTML/CSS resume rendering as the primary implementation path.
- Keep resume content separate from render settings.
- Build around a canonical structured resume schema.

### Layout and UI rules

- Preserve the split left-right structure for:
  `editor`, `ats`, and `jd`
- Do not collapse those pages into unrelated layouts.
- `landing` and `dashboard` are core anchor pages.

### Styling rules

- Keep the current React styling system as the active source of truth:
  `src/styles/tokens.css`
  `src/styles/globals.css`
  `tailwind.config.ts`
- Do not apply the new root `globals.css` now.
- Only revisit that file later as reference material.
- Future color unification should happen through the current token system, not by mixing two design systems directly.

### External-project boundary rules

- The external reference project may be used only for:
  resume schema
  resume section definitions
  item field shapes
  section ordering ideas
  normalization ideas
  render-related schema concepts
- Do not borrow from that project:
  design
  styling
  UI
  routing
  component patterns
  framework choices
  backend architecture
  deployment setup
- If something from that project is not directly about the resume schema or schema-adjacent behavior, ignore it.

### Working rules for future context reading

- If asked to absorb another project or document first, do not jump into implementation before reading it.
- Keep the reuse boundary explicit before applying any borrowed idea.
- When in doubt, prefer preserving this project's own direction over importing outside patterns.

## Next phase of action

### Phase 1. Finalize the local canonical resume schema

- Create the local schema contract for this repo.
- Define:
  `ResumeData`
  section item types
  `ResumeSectionKey`
  `RenderOptions`
- Decide which parts of the external schema are kept exactly and which parts are trimmed.
- Lock down normalization expectations early.

### Phase 2. Map the editor UI to the schema

- Turn the editor into a real schema-driven page.
- The left side should edit structured resume data.
- The right side should become the future preview/output side for compiled TeX/PDF.
- Keep it state-driven before persistence is introduced.

### Phase 3. Build the TeX rendering contract

- Create one controlled TeX template first.
- Build the serializer from structured resume data into template input.
- Define the minimal render settings needed at the start:
  template
  page limit
  margin
  optional font size
- Keep this minimal at first.

### Phase 4. Introduce parsing flow

- Add resume text/file intake later.
- Parse into the canonical resume schema.
- Normalize and validate before rendering.
- Groq is currently intended for parsing.

### Phase 5. JD and ATS flows

- Add JD parsing and matching after the resume schema and TeX flow are stable.
- Add ATS analysis after the same canonical resume contract is in place.
- Both should consume the same structured resume data rather than inventing separate data shapes.

### Phase 6. Persistence and accounts

- Only after the core flow works:
  consider accounts, multiple resumes, and saved state.

### Phase 7. Later-stage style unification and deployment

- Revisit the deferred `globals.css` comparison later.
- Tighten color consistency across current and future pages through the active token system.
- Evaluate the cheapest safe TeX deployment path when the functional loop is real.

## Notes to keep in mind

- The external repo context has been absorbed, but not adopted wholesale.
- The main immediate risk is not styling, but prematurely building around the wrong schema.
- The next meaningful implementation step should begin with the local schema contract, not with more visual surface area.
