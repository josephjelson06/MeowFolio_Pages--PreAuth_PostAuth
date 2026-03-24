# Action Plan And Log

## Current direction

- This project is being rebuilt around the core pages only:
  `landing`, `dashboard`, `editor`, `ats`, and `jd`.
- The resume path is TeX-first.
  Do not introduce HTML/CSS resume rendering as the main output path.
- `editor`, `ats`, and `jd` must preserve the split left-right workspace structure.
- Functionality comes before design polish.
- The current React token system remains the active styling foundation for now.

## Current status snapshot

- Phase 1 schema foundation:
  complete
- Phase 2 live editor wiring:
  complete for local state-driven editing
- Phase 3 TeX draft and compile path:
  locally operational
- Phase 4 parsing/import:
  in progress with local pasted-text and file import into `ResumeData`
- Phase 5 ATS/JD analysis:
  in progress with deterministic scoring, render checks, and evidence breakdown
- Shared workspace state:
  complete for in-memory editor, ATS, and JD flow

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

### 14. Phase 3 TeX contract started

- A local TeX rendering helper layer was added in:
  `src/lib/tex.ts`
- `RenderOptions` are now wired through the editor page and sidebar.
- The editor now supports local render settings for:
  template, page limit, margin, font size, max bullets, and section order.
- The preview panel now generates a TeX draft from:
  `ResumeData + RenderOptions`
- This established the frontend-side contract for TeX generation before live PDF compilation.

### 15. Compile service architecture added

- A local server-side render service was added:
  `server/index.ts`
  `server/lib/compile.ts`
- Shared render API types were added:
  `src/types/render.ts`
- A frontend API client was added:
  `src/lib/render-client.ts`
- The preview panel can now:
  - check compiler health
  - request PDF compilation
  - display a compiled PDF when the backend returns one
  - show a clear failure state when no TeX engine is installed
- The editor now includes render settings that flow into the API payload:
  template, page limit, margin, font size, bullet cap, section order
- Dev/build wiring was updated:
  `package.json`
  `vite.config.ts`
  `tsconfig.server.json`

### 16. Local TeX engine installed and verified

- `tectonic 0.15.0` was installed locally on March 24, 2026.
- The local compile stack is now working end to end:
  `/api/health` returns `engineAvailable: true`
  `/api/render/tex` returns generated TeX correctly
  `/api/render/pdf` returns a real compiled PDF
- A live smoke test was run against the render service with sample resume payload data.
- The PDF compile response returned `200` and produced a valid PDF file with a `%PDF-1.5` header.
- This means the project has moved from:
  "compile architecture exists"
  to:
  "local TeX-backed PDF generation is operational"
- The next work is no longer engine setup.
  It is product work on top of the now-working resume pipeline.

### 17. Phase 4 parsing/import started

- A first local import parser was added in:
  `src/lib/resume-import.ts`
- The editor sidebar now includes a paste-based import section:
  `src/components/editor/EditorSidebar.tsx`
- This import flow:
  - accepts pasted resume text
  - detects common section headings
  - maps imported content into the canonical `ResumeData` shape
  - replaces the current editor state with imported schema data
  - reports detected sections and import warnings back to the user
- This first version is intentionally deterministic and local.
  It is a bootstrap path, not the final AI/file-import pipeline.
- The current build passes after the parsing/import addition.

### 18. File upload intake added on top of the parser

- A file-import API path was added for uploaded resume files:
  `server/lib/import-file.ts`
  `src/lib/import-client.ts`
  `src/types/import.ts`
- The editor import section now supports uploaded:
  `.txt`
  `.md`
  `.pdf`
  `.docx`
- Uploaded files are converted to extracted text first, then routed through the same canonical `ResumeData` parser.
- The upload flow now returns:
  extracted text
  detected sections
  parsed resume data
  import warnings
- Local runtime verification was completed for:
  text-file upload
  PDF upload
- The parser was also tightened to handle common noisy PDF lines such as page markers more safely.

### 19. ATS and JD pages now consume canonical resume data

- The old mock-only ATS and JD screens were replaced with schema-driven local analysis flows.
- A deterministic analysis layer was added in:
  `src/lib/analysis.ts`
  `src/types/analysis.ts`
- ATS and JD routes now hold real state instead of rendering static mock payloads:
  `src/app/routes/AtsPage.tsx`
  `src/app/routes/JdPage.tsx`
- Both analysis sidebars now use reusable resume import controls:
  `src/components/analysis/ResumeImportCard.tsx`
- ATS now scores imported `ResumeData` directly with local rule checks and issue generation.
- JD now compares imported `ResumeData` against pasted job description text using a deterministic keyword overlap pass.
- The split left-right workspace structure for both pages was preserved.
- `npm run build` passes after the ATS/JD refactor.

### 20. Editor, ATS, and JD now share one in-memory workspace state

- A shared workspace provider was added in:
  `src/app/workspace/WorkspaceContext.tsx`
- The app router now wraps routes with this shared workspace context:
  `src/app/router.tsx`
- `editor`, `ats`, and `jd` no longer own separate route-local resume state.
- The following are now shared across workspace pages during the current browser session:
  resume data
  render options
  job description text
- This means:
  imports or edits made in the editor can now carry into ATS and JD without rebuilding the state separately on each page.
- This is still in-memory only.
  No persistence or account-backed storage has been added yet.

### 21. ATS and JD analysis quality upgraded

- The deterministic analysis layer was expanded to become:
  section-aware
  render-aware
  evidence-aware
- ATS now considers shared render settings such as:
  font size
  page limit
  bullet density
  margin safety
  section ordering
- ATS report output now includes:
  render checks
  section signals
  richer issue generation tied to both content and output settings
- JD analysis now returns keyword-level evidence instead of only score buckets.
- JD report output now includes:
  matched evidence
  keyword breakdown
  clearer missing/partial suggestions grounded in where evidence is or is not present
- `npm run build` passes after this analysis-quality pass.

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
- The main immediate risk is no longer TeX installation.
  It is drifting the product before the parsing and analysis flows are tied cleanly to the canonical schema.
- The next meaningful implementation step should focus on:
  parsing/import
  TeX template hardening
  JD/ATS flows on top of the same schema
