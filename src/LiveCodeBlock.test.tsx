import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";
import { LiveCodeBlock } from "./LiveCodeBlock";
import { LiveCodeDocsBlock } from "./LiveCodeDocsBlock";
import { Stack } from "./Stack";
import "./styles.css";

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

const compositionSnippet = `<Stack spacing={2} direction="row">
  <Button color="primary" variant="contained" size="small">One</Button>
  <Button color="success" variant="outlined" size="medium">Two</Button>
</Stack>`;

function renderLiveCode(overrides: Partial<Parameters<typeof LiveCodeBlock>[0]> = {}) {
  return render(
    <LiveCodeBlock
      collapsedCode={snippet}
      code={source}
      mode="minimal"
      scope={{ Button, Stack }}
      title="Test live code"
      {...overrides}
    />
  );
}

describe("LiveCodeBlock", () => {
  it("renders collapsed JSX through the provided scope", async () => {
    renderLiveCode();

    expect(await screen.findByRole("button", { name: "Save changes" })).toBeTruthy();
  });

  it("renders expanded default-export examples through the provided scope", async () => {
    const user = userEvent.setup();
    renderLiveCode();

    await user.click(screen.getByRole("button", { name: "Expand code" }));

    expect(await screen.findByRole("button", { name: "Save changes" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Collapse code" })).toBeTruthy();
  });

  it("renders composition snippets from scope", async () => {
    renderLiveCode({
      collapsedCode: compositionSnippet,
      code: compositionSnippet,
      mode: "composition"
    });

    expect(await screen.findByRole("button", { name: "One" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Two" })).toBeTruthy();
  });

  it("applies the requested theme", () => {
    const { container } = renderLiveCode({ theme: "light" });

    expect(container.querySelector(".liveCode")?.getAttribute("data-theme")).toBe("light");
  });

  it("shows render errors without crashing the shell", async () => {
    renderLiveCode({
      collapsedCode: "<MissingButton />",
      code: "<MissingButton />",
      scope: {}
    });

    await waitFor(() => {
      expect(screen.getByText(/MissingButton is not defined/)).toBeTruthy();
    });

    expect(screen.getByRole("button", { name: "Expand code" })).toBeTruthy();
  });

  it("can hide the preview until full screen is opened", async () => {
    const user = userEvent.setup();
    const { container } = renderLiveCode({ showPreview: false });

    expect(container.querySelector(".liveCode__preview")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Full screen" }));

    expect(await screen.findByRole("button", { name: "Save changes" })).toBeTruthy();
    expect(container.querySelector(".liveCode__preview")).toBeTruthy();
  });
});

describe("LiveCodeDocsBlock", () => {
  it("marks the previous Storybook docs preview when replacing preview actions", async () => {
    const { container } = render(
      <>
        <div className="sbdocs-preview">
          <div className="sbdocs-preview-actions">Actions</div>
        </div>
        <LiveCodeDocsBlock
          collapsedCode={snippet}
          code={source}
          mode="minimal"
          scope={{ Button, Stack }}
          title="Docs live code"
        />
      </>
    );

    expect(await screen.findByRole("textbox", { name: "Docs live code editable code" })).toBeTruthy();
    expect(container.querySelector(".liveCode__preview")).toBeNull();
    expect(container.querySelector(".sbdocs-preview")?.classList).toContain(
      "liveCodeDocsPreview"
    );
  });

  it("can render docs live code without replacing preview actions", async () => {
    const { container } = render(
      <>
        <div className="sbdocs-preview" />
        <LiveCodeDocsBlock
          collapsedCode={snippet}
          code={source}
          mode="minimal"
          replacePreviewActions={false}
          scope={{ Button, Stack }}
          title="Docs live code"
        />
      </>
    );

    expect(await screen.findByRole("textbox", { name: "Docs live code editable code" })).toBeTruthy();
    expect(container.querySelector(".sbdocs-preview")?.classList).not.toContain(
      "liveCodeDocsPreview"
    );
  });

  it("can opt into preview rendering in docs mode", async () => {
    const { container } = render(
      <LiveCodeDocsBlock
        collapsedCode={snippet}
        code={source}
        mode="minimal"
        showPreview
        scope={{ Button, Stack }}
        title="Docs live code"
      />
    );

    expect(await screen.findByRole("button", { name: "Save changes" })).toBeTruthy();
    expect(container.querySelector(".liveCode__preview")).toBeTruthy();
  });
});
