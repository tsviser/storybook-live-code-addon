import type { Meta, StoryObj } from "@storybook/react-vite";
import { LiveCodeBlock } from "./LiveCodeBlock";
import { Button } from "./Button";

const minimalCode = `import { Button } from "./Button";

export default function BasicButton() {
  return (
    <Button color="primary" variant="contained">
      Save changes
    </Button>
  );
}`;

const minimalSnippet = `<Button color="primary" variant="contained">
  Save changes
</Button>`;

const compositionCode = `import { Button } from "./Button";
import { Stack } from "./Stack";

export default function ButtonComposition() {
  return (
    <Stack spacing={2} direction="row">
      <Button color="primary" variant="contained" size="small">One</Button>
      <Button color="success" variant="outlined" size="medium">Two</Button>
      <Button color="danger" variant="text" size="large">Three</Button>
    </Stack>
  );
}`;

const compositionSnippet = `<Stack spacing={2} direction="row">
  <Button color="primary" variant="contained" size="small">One</Button>
  <Button color="success" variant="outlined" size="medium">Two</Button>
  <Button color="danger" variant="text" size="large">Three</Button>
</Stack>`;

const meta = {
  title: "Safe Sandbox/Button Live Code",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A mock Button sandbox for designing the live-code UX before migrating it into Crossroads UI."
      }
    }
  }
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Minimal: Story = {
  render: () => (
    <LiveCodeBlock
      collapsedCode={minimalSnippet}
      code={minimalCode}
      mode="minimal"
      sourcePath="/Users/tsvidaphna/Documents/Codex/2026-08-03/co/work/storybook-button-live-code/src/Button.stories.tsx:5"
      title="Minimal live code"
    />
  )
};

export const Composition: Story = {
  render: () => (
    <LiveCodeBlock
      collapsedCode={compositionSnippet}
      code={compositionCode}
      mode="composition"
      sourcePath="/Users/tsvidaphna/Documents/Codex/2026-08-03/co/work/storybook-button-live-code/src/Button.stories.tsx:15"
      title="Composition live code"
    />
  )
};
