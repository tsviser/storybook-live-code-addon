import type { Meta, StoryObj } from "@storybook/react-vite";
import { LiveCodeBlock } from "./LiveCodeBlock";
import { Button } from "./Button";
import { Stack } from "./Stack";

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
          "A mock Button sandbox for designing the live-code UX before migrating it into a production design system."
      }
    }
  }
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;
const scope = { Button, Stack };

export const Minimal: Story = {
  render: () => (
    <LiveCodeBlock
      collapsedCode={minimalSnippet}
      code={minimalCode}
      mode="minimal"
      scope={scope}
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
      scope={scope}
      title="Composition live code"
    />
  )
};

export const LightTheme: Story = {
  render: () => (
    <LiveCodeBlock
      collapsedCode={minimalSnippet}
      code={minimalCode}
      mode="minimal"
      scope={scope}
      theme="light"
      title="Light theme live code"
    />
  )
};
