# Storybook Live Code

MUI-inspired live code blocks for Storybook Docs.

## Fork Status

This repository is a fork-derived prototype for exploring a cleaner Storybook live-code experience.

Before publishing this repo publicly, add the original upstream project URL here and keep any upstream license or copyright notices required by that project:

```txt
Original project: TODO
Upstream license: TODO
Fork owner: tsvidaphna
```

This fork is not currently presented as a drop-in replacement for the upstream package. It is focused on validating the live-code UX before extracting a production Storybook addon.

This prototype focuses on a clean docs authoring experience:

- collapsed code shows the small component JSX snippet
- expanded code shows imports and the full wrapper function
- full screen gives a larger workspace without changing code mode
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
      sourcePath="/absolute/path/to/Button.stories.tsx:5"
      theme="dark"
      title="Basic button"
    />
  );
}
```

`theme` can be `"dark"`, `"light"`, or `"system"`. The default is `"dark"` to match the MUI-style docs code surface.

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
- generated folders such as `node_modules`, `storybook-static`, `dist`, and `coverage` are ignored

## Roadmap

- Extract Storybook-specific docs helpers around `parameters.docs.page`.
- Add a registry-driven API for component examples.
- Replace the mock preview parser with a real scoped React renderer.
- Add tests after the manual UX review is complete.

## Status

`0.1.0` is a shareable prototype, not a production-ready Storybook addon yet.
