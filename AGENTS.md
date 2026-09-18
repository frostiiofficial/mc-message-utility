# Agent Guidance

## Project Shape

This is a React 19 + TypeScript + Vite application for converting Minecraft message content. The app uses Tailwind CSS v4, Lucide icons, Monaco Editor, React Aria Components, and `react-resizable-panels`.

- `src/main.tsx` is the entry point and loads global styles.
- `src/App.tsx` owns application state, localStorage sessions, parsing, conversion actions, panel layout, and toast calls.
- `src/components/NavBar.tsx` owns toolbar actions, language selection, uploads, conversion rules, and structure visibility.
- `src/components/CodeEditor.tsx` wraps Monaco and exposes imperative editor operations through `CodeEditorHandle`.
- `src/components/StructureView.tsx` renders parsed fields, expansion, checkbox selection, and selected-field conversion.
- `src/utils/parse-structure.ts` parses YAML, JSON, Properties/INI, and plaintext into flattened `StructureField` records.
- `src/utils/smallCaps.ts` performs conversion while preserving protected Minecraft syntax and handling emoji/content replacements.
- `src/data/Language.ts` defines supported languages and Monaco mappings.

Keep state and behavior in `App.tsx` unless a change clearly belongs to a child component or utility. Preserve explicit prop and callback boundaries between components.

## Commands

- `npm run dev` starts the Vite development server.
- `npm run build` runs the production build and is the minimum required validation for code changes.
- `npx tsc -b` runs the TypeScript project build without emitting files.
- `npx oxlint .` runs Oxlint directly; there is no package-level lint script.
- There is currently no automated test suite.
- `npm run deploy` publishes `dist` through GitHub Pages and should only be used when explicitly requested.

## Implementation Notes

- Follow the existing TypeScript settings, including strict unused-local and unused-parameter checks, `verbatimModuleSyntax`, and `erasableSyntaxOnly`.
- Use the existing Tailwind class patterns, dark zinc-based visual language, Nunito UI text, JetBrains Mono editor text, and Lucide controls. Read `.github/skills/frontend-implementation/SKILL.md` for frontend work.
- Monaco edits are imperative. When changing conversion or selection behavior, preserve editor synchronization, selection replacement, and the `CodeEditorHandle` contract.
- Structure selections use flattened dot-delimited paths and a content signature to invalidate stale selections.
- YAML parsing temporarily protects Minecraft ampersand color codes. Do not change parser preprocessing without checking valid Minecraft messages.
- Conversion must preserve protected syntax exactly, including `<...>` tags and their gradient hex values, bracketed placeholders, and escaped sequences such as `\\n`; only eligible message text should be transformed.
- Saved sessions live in `localStorage`; maintain compatibility when changing the `SavedSession` shape or persisted selection data.
- Keep `dist/` and `node_modules/` out of source changes.
- Preserve the Vite base path `/mc-message-utility/` required for GitHub Pages deployment.

## Change Workflow

1. Trace state ownership in `App.tsx` before changing child props, parsing, conversion, or persistence.
2. Keep changes focused and preserve existing public component and utility contracts.
3. Run `npm run build`; also run `npx tsc -b` or `npx oxlint .` when the change affects types or lint-sensitive code.
4. For behavior changes without existing tests, manually verify the affected editor, structure-selection, persistence, or conversion workflow in the dev server.
