# Storybook Live Code

MUI-inspired live code blocks for Storybook Docs.

This prototype focuses on a clean docs authoring experience:

- collapsed code shows the small component JSX snippet
- expanded code shows imports and the full wrapper function
- full screen gives a larger workspace without changing code mode
- editor height fits content until a max height, then scrolls internally
- CodeMirror powers editing, selection, keyboard behavior, and syntax color
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
      title="Basic button"
    />
  );
}
```

## Roadmap

- Extract Storybook-specific docs helpers around `parameters.docs.page`.
- Add a registry-driven API for component examples.
- Replace the mock preview parser with a real scoped React renderer.
- Add tests after the manual UX review is complete.

## Status

`0.1.0` is a shareable prototype, not a production-ready Storybook addon yet.
