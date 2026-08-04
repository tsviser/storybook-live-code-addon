# Changelog

## 0.3.3

- Fixed syntax coloring for pasted JSX with multiline opening tags.
- Made `Tab` insert soft indentation inside the live-code editor instead of moving focus out of the editor.

## 0.3.2

- Added `LiveCodePreview` for rendering edited code in a separate docs canvas.
- Added `onCodeChange` to `LiveCodeBlock` and `LiveCodeDocsBlock`.
- Added a More actions theme menu with `System`, `Dark`, and `Light` choices.
- Removed the JS/TS segmented control from the toolbar.
- Made expand/collapse transform between compact JSX snippets and full source without changing the edited example.
- Wrapped duplicated sibling JSX roots in a fragment when expanding to full source.
- Added snippet-safe syntax coloring for JSX snippets and expanded source.
- Exposed syntax color CSS variables for component names, prop keys, prop values, keywords, function names, and module paths.
- Reduced toolbar height, button height, icon size, and editor border width.
- Removed the unused `@codemirror/theme-one-dark` dependency.

## 0.3.1

- Added `showPreview` to `LiveCodeBlock`.
- Made `LiveCodeDocsBlock` render toolbar and editor only by default.
- Kept live preview available when docs live code enters full screen.
- Removed bottom spacing from Storybook docs previews when live code replaces preview actions.

## 0.3.0

- Added `LiveCodeDocsBlock` for integrated Storybook Docs examples.
- Added docs-mode CSS to hide default Storybook preview actions when live code replaces them.
- Added sandbox story and tests for the integrated docs mode.

## 0.2.3

- Reduced icon-button padding so toolbar glyphs fill the action controls more clearly.

## 0.2.2

- Enlarged live-code toolbar glyphs and touch targets for clearer icon actions.

## 0.2.1

- Increased live-code toolbar icon button and SVG sizes for better readability.

## 0.2.0

- Added Vitest coverage for scoped rendering, expand mode, themes, and render errors.
- Added scoped React live rendering through `scope`, replacing the mock-only preview parser.
- Added `theme="dark" | "light" | "system"` for live code blocks.
- Added a light theme Storybook example for manual review.
- Added fork hygiene notes, package metadata, and public-safe Storybook examples.
- Added library build output, package exports, peer dependencies, and npm pack validation.

## 0.1.0

- Added a safe Storybook sandbox with mock Button and Stack components.
- Added MUI-style collapsed and expanded code modes.
- Added CodeMirror-based editing with a dark code theme.
- Added content-aware editor height with capped internal scrolling.
- Added full-screen workspace mode.
- Added icon-based toolbar actions for copy, reset, full screen, VS Code, and more.
