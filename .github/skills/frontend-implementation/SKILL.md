---
name: frontend-implementation
description: "Design and implement polished React/Vite frontend features. Use for UI changes, responsive layouts, component work, interaction states, accessibility, visual refinement, and frontend validation in an existing application."
argument-hint: "Describe the frontend feature or visual change to implement"
user-invocable: true
---

# Frontend Implementation

## Purpose

Implement a complete frontend change that fits the existing product instead of producing an isolated mockup. Preserve the repository's framework, component conventions, interaction model, and visual language unless the request explicitly calls for a redesign.

## Workflow

### 1. Establish the local contract

Read the nearest owning component, its styles, and one adjacent component or call site. Inspect `package.json` for the available scripts and UI libraries. Identify:

- The component or route that owns the requested behavior.
- The existing data and event flow.
- The established spacing, typography, color, icon, and responsive patterns.
- The cheapest focused check that could disprove the implementation hypothesis.

Do not broaden exploration after the controlling code path and a discriminating check are clear.

### 2. Define the interaction before styling

Write down the states the user can encounter: idle, hover, focus, disabled, loading, empty, success, error, and narrow viewport where relevant. Decide which state is controlled by the existing model and which state, if any, needs a new prop or local state.

Prefer existing primitives and helpers. Use library icons, semantic HTML, and the repository's existing notification, modal, form, and layout patterns. Do not introduce a dependency when the current stack already supports the behavior.

### 3. Make the smallest coherent edit

Keep the change close to its owning boundary. Reuse existing components and utilities before adding abstractions. For new UI:

- Use stable dimensions for controls, panels, grids, and repeated items.
- Keep text inside its container at desktop and mobile widths.
- Use familiar icons for icon-only actions and provide accessible names or tooltips.
- Use semantic headings, labels, buttons, and landmarks.
- Avoid decorative cards inside cards, oversized marketing sections, and unexplained visible instructions.
- Match the existing palette; do not default to purple gradients or a generic dark dashboard.
- Add motion only for meaningful entrance, loading, or state transitions, and respect reduced-motion preferences where applicable.

### 4. Validate the touched behavior immediately

After the first substantive edit, run the narrowest available executable check before further exploration or patching. Prefer, in order:

1. A focused test or interaction check.
2. A targeted typecheck or lint command.
3. `npm run build` when no narrower check exists.

Repair failures in the same slice and rerun the same check. Do not expand into unrelated cleanup.

### 5. Inspect the experience at important widths

When a browser or Playwright tool is available, run the app and inspect the changed flow at a desktop width and a narrow mobile width. Check that:

- The first viewport communicates the primary task.
- Controls remain reachable and do not overlap or shift unexpectedly.
- Keyboard focus is visible and the full flow works without a pointer.
- Loading, empty, error, and success states are legible.
- Text, icons, borders, and contrast remain understandable.

Use screenshots or targeted DOM checks when they reveal layout problems faster than code inspection. Fix only issues caused by or required for the requested change.

### 6. Close with evidence

Run at least one post-edit executable validation even if the visual inspection succeeds. Report the files changed, the behavior implemented, and the exact validation command or browser check performed. Mention any unavailable checks or residual risk briefly.

## Decision Rules

- If the request conflicts with an existing design system, follow the design system unless the request clearly intends a redesign.
- If behavior is ambiguous, choose the smallest reversible behavior and surface the assumption before widening the edit.
- If a component only forwards props, step to the nearest code that computes state or mutates data.
- If the first validation disproves the hypothesis, make one nearby hop to the direct owner rather than restarting repository exploration.
- If a visual change has no behavior impact, still validate build/type safety and inspect responsive layout when possible.

## Completion Checklist

- [ ] The owning component and existing conventions were checked.
- [ ] User-visible states and interaction semantics are covered.
- [ ] The change uses existing dependencies and APIs where practical.
- [ ] Responsive layout, keyboard access, and accessible names were considered.
- [ ] A focused executable validation passed after editing.
- [ ] The final result reports changed files and validation evidence.