# React UI Migration Blueprint

## Goal
Rebuild the current static HTML site as a UI-only React project.

This migration is intentionally presentational:
- no `localStorage`
- no real clicks or workflows
- no uploads
- no resume persistence
- no analysis logic

The React app should preserve:
- the overall visual identity from `landing` and `index`
- the split-screen structure of:
  - `app/editor-content.html`
  - `app/PostAuth/ats-scorer.html`
  - `app/PostAuth/jd-analyzer.html`

It should not preserve the current runtime behavior from:
- `app/app.js`
- `app/page-modules.js`
- `app/pages-*.js`


## Source Of Truth
These files define the visual direction we keep:
- `app/landing.html`
- `app/PostAuth/index.html`
- `app/editor-content.html`
- `app/PostAuth/ats-scorer.html`
- `app/PostAuth/jd-analyzer.html`
- `app/shared.css`
- `app/tailwind-config.js`
- `app/DESIGN.md`

These are the non-core pages and should not drive architecture:
- auth pages
- legal pages
- chapter pages
- redirect pages
- derivative pages like `ats-report` and `jd-results`


## What We Preserve

### 1. Public marketing structure
From `app/landing.html`:
- sticky top nav
- bold editorial hero
- playful tactile cards
- large section rhythm
- high-contrast headline/body pairing

### 2. App dashboard structure
From `app/PostAuth/index.html`:
- logged-in shell
- top navigation
- KPI band
- dashboard grid
- quick-action right rail feel

### 3. Workspace split layout
From the three core tool pages:
- left panel = controls/editor/input
- right panel = preview/report/output
- top nav remains consistent
- dense, productive workspace feel

This split layout is non-negotiable and must become a shared layout primitive.


## What We Drop
- broken multi-folder static routing
- all imperative DOM bootstrapping
- `data-action` behavior wiring
- dynamic HTML injection
- local-first storage model
- upload parsing
- scoring logic
- page redirects as behavior

If a screen needs content, use mock data.


## Recommended Stack
- React
- TypeScript
- Vite
- React Router
- Tailwind CSS

Why this stack:
- Vite is the cleanest starting point for a static UI rebuild
- React Router gives simple control over the 5-page UI flow
- Tailwind is already embedded in the current HTML language
- TypeScript helps keep the component system clean as the UI grows


## Final Route Map
- `/` -> `LandingPage`
- `/dashboard` -> `DashboardPage`
- `/editor` -> `EditorPage`
- `/ats` -> `AtsPage`
- `/jd` -> `JdPage`

Optional later routes:
- `/profile`
- `/resumes`
- `/about`
- `/learn`

But these should not block the first migration.


## Component Architecture

### Layouts
- `PublicLayout`
  - used by `LandingPage`
  - handles public nav and footer

- `AppLayout`
  - used by `DashboardPage`
  - handles logged-in top nav and app container spacing

- `WorkspaceSplitLayout`
  - used by `EditorPage`, `AtsPage`, `JdPage`
  - owns the left/right preserved structure
  - should support:
    - `left`
    - `right`
    - optional top header content
    - responsive collapse on smaller screens

### Shared UI
- `TopNav`
- `BrandMark`
- `Button`
- `Chip`
- `Card`
- `StatCard`
- `Panel`
- `SectionHeading`
- `MetricRing`

### Editor-specific
- `EditorSidebar`
- `EditorTabs`
- `AccordionSection`
- `ResumePreview`
- `TemplateStrip`
- `CustomizePanel`

### ATS-specific
- `AtsSidebar`
- `AtsIntroState`
- `AtsReportPanel`
- `IssueList`

### JD-specific
- `JdSidebar`
- `JdInputPanel`
- `JdReportPanel`
- `KeywordStats`


## Proposed Folder Structure
```txt
src/
  app/
    router.tsx
    routes/
      LandingPage.tsx
      DashboardPage.tsx
      EditorPage.tsx
      AtsPage.tsx
      JdPage.tsx
  components/
    layout/
      PublicLayout.tsx
      AppLayout.tsx
      WorkspaceSplitLayout.tsx
      TopNav.tsx
    ui/
      BrandMark.tsx
      Button.tsx
      Card.tsx
      Chip.tsx
      Panel.tsx
      SectionHeading.tsx
      StatCard.tsx
      MetricRing.tsx
    editor/
      EditorSidebar.tsx
      EditorTabs.tsx
      AccordionSection.tsx
      ResumePreview.tsx
    analysis/
      AtsSidebar.tsx
      AtsIntroState.tsx
      AtsReportPanel.tsx
      JdSidebar.tsx
      JdInputPanel.tsx
      JdReportPanel.tsx
  data/
    dashboard.ts
    editor.ts
    ats.ts
    jd.ts
  styles/
    tokens.css
    globals.css
```


## Design Token Extraction
The current tokens already exist implicitly across:
- `app/shared.css`
- `app/tailwind-config.js`
- `app/DESIGN.md`

Extract them first into `src/styles/tokens.css`.

### Preserve These Foundations

#### Fonts
- Headline: `Plus Jakarta Sans`
- Body: `Inter`

#### Base surfaces
- `background`: `#fdf9f3`
- `surface-container-low`: `#f7f3ed`
- `surface-container`: `#f1ede7`
- `surface-container-highest`: `#e6e2dc`
- `surface-container-lowest`: `#ffffff`

#### Primary visual language
- chunky borders
- tactile shadows
- soft warm background
- editorial spacing
- rounded cards
- playful but premium proportions

#### Keep these utility ideas
- dotted background
- tactile button
- tactile card
- soft glass panel
- bubble badge

### Do Not Treat Current Theme Color As Locked
You said the exact theme color can change.

That means:
- preserve token structure
- preserve contrast hierarchy
- preserve shadow/border/spacing personality
- preserve layout shapes
- allow color palette swap later


## Critical Layout Rules

### Rule 1: Split tools must stay split
Do not redesign `editor`, `ats`, or `jd` into single-column app pages.

Keep them as workspace screens.

### Rule 2: The split layout becomes a reusable shell
Do not rebuild left/right structure separately three times.

Create one layout:
- editor uses it
- ATS uses it
- JD uses it

### Rule 3: Preserve proportions, not exact pixel hacks
Current page ratios:
- editor: left-heavy editing area with right preview
- ATS: narrow left rail, wide right report
- JD: roughly 40/60 split

In React:
- define ratio variants:
  - `balanced`
  - `sidebar`
  - `editor`

Suggested variants:
- `editor`: `grid-cols-[minmax(380px,45%)_1fr]`
- `sidebar`: `grid-cols-[380px_1fr]`
- `analysis`: `grid-cols-[minmax(360px,40%)_1fr]`

### Rule 4: Mobile can stack, desktop cannot
On mobile:
- stack panels vertically

On desktop:
- the split layout must remain visibly two-part


## Page Mapping

### 1. LandingPage
Source:
- `app/landing.html`

Keep:
- public nav
- hero
- story strip
- feature cards
- template section
- FAQ structure

Simplify:
- CTAs can be plain buttons/links with no real behavior

### 2. DashboardPage
Source:
- `app/PostAuth/index.html`

Keep:
- KPI cards
- active resumes section
- quick actions rail
- warm app-shell tone

Replace with mock data:
- greeting
- cards
- scores
- resume tiles

### 3. EditorPage
Source:
- `app/editor-content.html`

Keep:
- top nav
- tab cluster
- left accordion editor
- right live preview panel

Drop:
- bindings
- AI actions
- add/remove item behavior

Use:
- hardcoded sample resume data

### 4. AtsPage
Source:
- `app/PostAuth/ats-scorer.html`

Keep:
- left preparation panel
- right analysis/report workspace
- circular score display
- score breakdown cards
- fix-list area

Drop:
- scanning behavior
- report toggling logic

Use:
- static mock report state

### 5. JdPage
Source:
- `app/PostAuth/jd-analyzer.html`

Keep:
- left resume panel
- right analyzer/report panel
- keyword counts
- score ring
- missing keyword list

Drop:
- text input logic
- upload logic
- PDF/DOCX handling
- actual analysis

Use:
- mock job description and mock report data


## Migration Order

### Phase 1: Foundation
1. Create the React app
2. Add Tailwind
3. Add router
4. Add font imports
5. Port tokens into `tokens.css`
6. Port the tactile utility classes into `globals.css`

### Phase 2: Layout Shells
1. Build `TopNav`
2. Build `PublicLayout`
3. Build `AppLayout`
4. Build `WorkspaceSplitLayout`

### Phase 3: Core Screens
1. `LandingPage`
2. `DashboardPage`
3. `EditorPage`
4. `AtsPage`
5. `JdPage`

This order matters:
- `landing` and `dashboard` establish brand
- `WorkspaceSplitLayout` unlocks the 3 most structurally important screens

### Phase 4: Cleanup
1. remove dependence on static HTML files
2. stop referencing old runtime JS
3. archive old pages instead of mixing them into the new app


## What To Reuse vs Rewrite

### Reuse conceptually
- structure
- spacing
- card language
- token names
- visual hierarchy

### Rewrite directly
- HTML markup into JSX
- all navigation
- all runtime interaction code
- all page boot logic

### Do not port as-is
- `app/app.js`
- `app/page-modules.js`
- `app/pages-analysis.js`
- `app/pages-editor.js`
- `app/pages-profile.js`
- `app/pages-public-content.js`


## Responsive Strategy

### Desktop
- preserve the editorial spaciousness
- keep strong horizontal composition
- split workspace stays split

### Tablet
- reduce gutters first
- preserve split layout if possible

### Mobile
- stack tool panels
- keep section identity obvious
- avoid trying to keep desktop widths literally


## First Implementation Checklist

### Immediate build checklist
- [ ] initialize React + Vite + TypeScript
- [ ] install Tailwind
- [ ] define routes
- [ ] create `tokens.css`
- [ ] create `globals.css`
- [ ] implement `TopNav`
- [ ] implement `WorkspaceSplitLayout`
- [ ] port `LandingPage`
- [ ] port `DashboardPage`
- [ ] port `EditorPage`
- [ ] port `AtsPage`
- [ ] port `JdPage`

### Mock-data checklist
- [ ] dashboard stats
- [ ] resume preview content
- [ ] ATS report content
- [ ] JD report content


## Recommended Build Decision
If there is any conflict between:
- preserving an old HTML detail exactly
- and keeping the new React UI consistent

choose consistency.

The product you are rebuilding is:
- a coherent React UI system
- inspired by the current best pages

It is not:
- a one-to-one archival port of every static page


## Final Direction
Think of the new React project as:

"One brand, two shells, three workspace tools."

- one brand system from `landing` + `index`
- two major shells:
  - public
  - app
- three preserved split workspace screens:
  - editor
  - ATS
  - JD

That is the cleanest path that preserves what matters and avoids carrying over the current static-site chaos.
