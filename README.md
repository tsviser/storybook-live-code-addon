# Storybook Live Code

MUI-inspired live code blocks for Storybook Docs.

## Fork Status

This repository is a fork-derived prototype for exploring a cleaner Storybook live-code experience.

This fork is derived from `JeremyRH/storybook-addon-code-editor`, an MIT-licensed Storybook addon for live editing stories.

```txt
Original project: https://github.com/JeremyRH/storybook-addon-code-editor
Upstream license: MIT
Fork owner: tsvidaphna
```

This fork is not currently presented as a drop-in replacement for the upstream package. It is focused on validating a MUI-inspired docs live-code UX before extracting a production Storybook addon.

This prototype focuses on a clean docs authoring experience:

- collapsed code shows the small component JSX snippet
- expanded code shows imports and the full wrapper function
- full screen gives a larger workspace without changing code mode
- scoped React rendering lets edited examples update the preview
- editor height fits content until a max height, then scrolls internally
- CodeMirror powers editing, selection, keyboard behavior, and syntax color
- dark, light, and system themes keep the editor readable in different docs surfaces
- utility toolbar actions use compact icon buttons with accessible labels

## Demo

Run the local Storybook demo:

```sh
npm install
npm run storybook
```

Open:

```txt
http://localhost:6016/?path=/story/safe-sandbox-button-live-code--composition
```

## Usage Shape

```tsx
import { LiveCodeBlock } from "storybook-live-code";
import "storybook-live-code/styles.css";
import { Button } from "./Button";

const snippet = `<Button color="primary" variant="contained">
  Save changes
</Button>`;

const source = `import { Button } from "./Button";

export default function BasicButton() {
  return (
    <Button color="primary" variant="contained">
      Save changes
    </Button>
  );
}`;

export function DocsExample() {
  return (
    <LiveCodeBlock
      collapsedCode={snippet}
      code={source}
      mode="minimal"
      scope={{ Button }}
      sourcePath="/absolute/path/to/Button.stories.tsx:5"
      theme="dark"
      title="Basic button"
    />
  );
}
```

`theme` can be `"dark"`, `"light"`, or `"system"`. The default is `"dark"` to match the MUI-style docs code surface.

`scope` provides the React components, helpers, and values that edited examples may use. Expanded examples can include `import` lines and an `export default function Example()` wrapper; the renderer strips imports and renders the default component.

## VS Code Links

`sourcePath` is optional. Pass an absolute local file path only inside your private docs environment:

```tsx
<LiveCodeBlock
  collapsedCode={snippet}
  code={source}
  mode="minimal"
  sourcePath="/absolute/path/to/Button.stories.tsx:5"
  title="Basic button"
/>
```

Public examples intentionally omit `sourcePath` so the published repo does not contain machine-specific paths.

## Package Hygiene

This repo intentionally keeps only the current prototype surface:

- `src/LiveCodeBlock.tsx` contains the reusable live-code component
- `src/Button.tsx` and `src/Stack.tsx` are mock components for the safe sandbox
- `src/Button.stories.tsx` is the manual Storybook review environment
- generated folders such as `node_modules`, `storybook-static`, `dist`, and `coverage` are ignored by git
- `prepack` builds `dist` automatically before npm creates a tarball

## Publishing Check

Run this before publishing:

```sh
npm run build
npm test
npm run build-storybook
npm pack --dry-run
```

## Roadmap

- Extract Storybook-specific docs helpers around `parameters.docs.page`.
- Add a registry-driven API for component examples.
- Add tests after the manual UX review is complete.

## Status

`0.1.0` is a shareable prototype, not a production-ready Storybook addon yet.
