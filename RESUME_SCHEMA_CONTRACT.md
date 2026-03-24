# Resume Schema Contract

## Purpose

This file defines the local canonical resume contract for this repo.

It is the source of truth for:
- the editor data shape
- TeX rendering input
- future parsing normalization
- future JD and ATS analysis input

This contract is informed by the external schema reference that was reviewed, but it is local to this repo and should be treated as the version we actually build against.

## Boundary rules

- Use the external reference project only for resume schema and schema-adjacent behavior.
- Do not import that project's UI, design, routing, framework, or backend architecture decisions into this repo.
- Keep resume content separate from render options.
- Keep the split `editor` / `ats` / `jd` layout structure intact while functionality is added later.

## Core decisions

### 1. Internal app model uses camelCase

The local React/TypeScript model uses camelCase field names.

Examples:
- `createdAt`
- `updatedAt`
- `startDate`
- `endDate`
- `sectionOrder`
- `pageLimit`

If a future API or parser boundary needs snake_case, that should be handled through explicit adapter functions instead of forcing snake_case into the React app.

### 2. Resume content and render settings are separate

Resume content belongs in `ResumeData`.

Rendering preferences belong in `RenderOptions`.

Template choice, margin, page limit, and font size should not live inside the core resume content model.

### 3. Canonical section set

The canonical section set is:
- `summary`
- `skills`
- `education`
- `experience`
- `projects`
- `certifications`
- `awards`
- `leadership`
- `extracurricular`

This keeps the section model aligned with the most useful part of the reference schema while staying simple enough for the current product direction.

## Canonical types

### ResumeMeta

Tracks local document metadata only.

Fields:
- `version: string`
- `createdAt: string`
- `updatedAt: string`
- `source: "scratch" | "upload" | "ai" | "import"`

Notes:
- ISO timestamp strings should be used.
- This is document metadata, not rendering metadata.

### ResumeHeader

Fields:
- `name`
- `title`
- `email`
- `phone`
- `location`
- `linkedin`
- `github`
- `website`
- `portfolio`

All header fields are nullable single values.

### SkillCategory

Fields:
- `category: string`
- `items: string[]`

### ResumeSkills

Supported shapes:
- flat list: `string[]`
- grouped list: `SkillCategory[]`

This is intentionally flexible so the editor, parser, and TeX serializer can handle both a quick manual skills list and grouped skill families.

### ExperienceItem

Fields:
- `id?: string | null`
- `role?: string | null`
- `company?: string | null`
- `location?: string | null`
- `startDate?: string | null`
- `endDate?: string | null`
- `current?: boolean`
- `description?: string | null`
- `bullets: string[]`

Rule:
- `description` and `bullets` should not both carry full content at the same time.
- If a concise paragraph description is used, bullets should usually be empty.
- If bullets are used, `description` should usually be null.

### EducationItem

Fields:
- `degree?: string | null`
- `field?: string | null`
- `institution?: string | null`
- `location?: string | null`
- `startYear?: string | null`
- `endYear?: string | null`
- `gpa?: string | null`

### ProjectItem

Fields:
- `title?: string | null`
- `description?: string | null`
- `startDate?: string | null`
- `endDate?: string | null`
- `technologies: string[]`
- `bullets: string[]`
- `link?: string | null`

Rule:
- Same as experience: prefer either paragraph description or bullets as the main body, not both at full weight.

### CompactItem

Used for:
- `certifications`
- `awards`
- `leadership`
- `extracurricular`

Fields:
- `description?: string | null`
- `date?: string | null`
- `link?: string | null`

These should stay concise and easy to serialize into TeX.

### ResumeData

`ResumeData` contains:
- `meta`
- `header`
- `summary`
- `skills`
- `experience`
- `education`
- `projects`
- `certifications`
- `awards`
- `leadership`
- `extracurricular`

### RenderOptions

Initial render settings:
- `templateId: string`
- `fontSize: number`
- `maxBulletsPerEntry: number`
- `margin: string`
- `pageLimit: 1 | 2`
- `sectionOrder: ResumeSectionKey[]`

This keeps rendering configurable without polluting the resume content model.

## Normalization rules

These rules should guide future parser and form normalization work.

### Text cleanup

- Trim leading and trailing whitespace.
- Convert empty strings to `null` for single-value text fields.
- Keep arrays free from blank string entries.

### Link cleanup

- Normalize obvious URLs and portfolio links later through dedicated helpers.
- Email-like values may be converted into `mailto:` links at the adapter or normalization layer.
- Do not overcomplicate link validation in the UI layer.

### Section cleanup

- `volunteering` should map into `extracurricular` if that legacy field appears at import time.
- Legacy/custom sections should not become permanent first-class schema keys.
- `publications` is not part of the canonical schema right now.

### Rendering-conscious limits

Limits should exist later to keep TeX output realistic for one-page and two-page resumes.

Expected future controls:
- max experience items
- max project items
- max compact items
- max bullets per entry

These are normalization concerns, not reasons to change the canonical section model.

## Defaults

### Default section order

Default order:
1. `summary`
2. `skills`
3. `education`
4. `experience`
5. `projects`
6. `certifications`
7. `awards`
8. `leadership`
9. `extracurricular`

### Default empty document behavior

- Empty arrays for list sections
- `null` or empty values for single-value fields
- `pageLimit` defaults to `1`
- `templateId` should default to the primary initial template once the TeX pipeline is introduced

## Explicit non-goals for now

- No HTML/CSS resume rendering contract
- No persistence contract yet
- No account/user ownership fields yet
- No multi-template schema branching
- No arbitrary custom sections in the canonical model

## Immediate implementation target

Phase 1 should result in:
- a local TypeScript resume model
- default constructors/constants
- current editor mock data using that model

That gives the repo a real contract before parser, TeX rendering, ATS, and JD functionality are added.
