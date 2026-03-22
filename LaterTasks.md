First priority is functionality. Whether resumes can be 
- created
- parsed and uploaded - and capture the users' resume.
- LaTeX or TeX engine introduction
- fit into templates (or atleast gracefully expand into 2 pages)

- the sections, templates choosing and customization 

- then jd upload, parse and score
- then ats analyze and score

- after that maybe create account wise - let a user save multiple resumes 
- after that, maybe see on designs

See globals.css and app/styles/globals.css and app/styles/tokens.css and see what can be made useful of the new globals.css file.

- then at last stage go to deployment -> constraint is that ($0 budget and users have $0 to invest) - so free - free for both sides.

- gonna use groq api keys for parsing. 

- main concern is regarding TeX - do i have to dockerize, do i have to create a separate service?
- what's the minimalistic safe version i can do right now? 
- assume just 100-200 users are gonna use overall.
- later will see if it becomes a concern about security. 

- now main priority after everything is done, is to get it out there for the public to use as fast as possible.

## Deferred design-system work

Keep this for later. Do not apply now.

### Analyze the new globals.css before using it

Compare:
- `globals.css`
- `src/styles/globals.css`
- `src/styles/tokens.css`

Current understanding:
- `src/styles/tokens.css` should remain the source of truth for colors, spacing, radii, shadows, and overall design tokens.
- `src/styles/globals.css` should remain the shared global layer for resets, utilities, layout helpers, and reusable visual behaviors.
- The new root `globals.css` is useful as reference, but it is currently a separate design system, not a drop-in addition.

### Main differences to remember

- The new `globals.css` uses a different Tailwind style:
  `@import "tailwindcss"` and `@theme`
- The current React app uses:
  `src/styles/tokens.css` + `src/styles/globals.css` + `tailwind.config.ts`
- The new `globals.css` has a simpler brand palette:
  brown, orange, pink, green, cream, yellow accent
- The current tokens are more semantic and scalable:
  background, surfaces, text, primary, secondary, tertiary, outline, charcoal, coral, lavender, mint
- The new `globals.css` is more component-skinned:
  `.cute-card`, `.cute-button`, `.pro-card`, `.pro-input`, etc.
- The current React styling is more token-driven and better suited for keeping all current and future pages visually unified.
- The new `globals.css` feels more playful and retro. The current system feels more editorial and workspace-friendly.

### Later unification goal

Unify colors and visual behavior across:
- landing
- dashboard
- editor
- ats
- jd
- future pages

### Later implementation plan

1. Keep `src/styles/tokens.css` as the single color and token source of truth.
2. Move any useful ideas from the new `globals.css` into the existing token system instead of merging that file directly.
3. Remove remaining hardcoded hex colors from React components and replace them with token-driven variants.
4. Create stricter component variants for:
   buttons, cards, panels, metric rings, badges, and surface backgrounds.
5. Decide the permanent page mood balance:
   marketing pages can be more expressive, but still must stay inside the same token family as app pages.
6. Only after the above, consider whether any class patterns from the new `globals.css` are worth reintroducing.
