import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

  it("renders sibling JSX snippets without requiring a wrapper", async () => {
    renderLiveCode({
      collapsedCode: `<Button color="primary" variant="contained">One</Button>
<Button color="success" variant="outlined">Two</Button>`,
      code: `<Button color="primary" variant="contained">One</Button>
<Button color="success" variant="outlined">Two</Button>`,
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

  it("can switch theme from the more actions menu", async () => {
    const user = userEvent.setup();
    const { container } = renderLiveCode({ theme: "dark" });

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(screen.getByRole("menuitemradio", { name: /Light/ }));

    expect(container.querySelector(".liveCode")?.getAttribute("data-theme")).toBe("light");

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(screen.getByRole("menuitemradio", { name: /Dark/ }));

    expect(container.querySelector(".liveCode")?.getAttribute("data-theme")).toBe("dark");
  });

  it("emits code changes from the editor", async () => {
    const user = userEvent.setup();
    const onCodeChange = vi.fn();
    const { container } = renderLiveCode({ onCodeChange });
    const editorContent = container.querySelector(".cm-content");

    expect(editorContent).toBeTruthy();

    await user.click(editorContent as HTMLElement);
    await user.keyboard("!");

    expect(onCodeChange).toHaveBeenCalled();
    expect(onCodeChange.mock.lastCall?.[0]).toContain("!");
    expect(onCodeChange.mock.lastCall?.[1]).toEqual({ isExpanded: false });
  });

  it("toggles between snippet and full source without changing the example", async () => {
    const user = userEvent.setup();
    const onCodeChange = vi.fn();
    const { container } = renderLiveCode({ onCodeChange });

    await user.click(screen.getByRole("button", { name: "Expand code" }));

    expect(onCodeChange.mock.lastCall?.[0]).toContain('import { Button } from "./Button";');
    expect(onCodeChange.mock.lastCall?.[0]).toContain('<Button color="primary" variant="contained">');
    expect(onCodeChange.mock.lastCall?.[1]).toEqual({ isExpanded: true });
    expect(container.querySelector(".liveCode__syntaxKeyword")).toBeTruthy();
    expect(container.querySelector(".liveCode__syntaxFunction")).toBeTruthy();
    expect(container.querySelector(".liveCode__syntaxModule")).toBeTruthy();
    expect(container.querySelector(".liveCode__syntaxComponent")).toBeTruthy();
    expect(container.querySelector(".liveCode__syntaxKey")).toBeTruthy();
    expect(container.querySelector(".liveCode__syntaxValue")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Collapse code" }));

    expect(onCodeChange.mock.lastCall?.[0]).toBe(snippet);
    expect(onCodeChange.mock.lastCall?.[1]).toEqual({ isExpanded: false });
  });

  it("keeps duplicated snippet JSX when expanding and collapsing", async () => {
    const user = userEvent.setup();
    const onCodeChange = vi.fn();
    const duplicatedSnippet = `<Button color="primary" variant="contained">One</Button>
<Button color="success" variant="outlined">Two</Button>`;

    renderLiveCode({
      collapsedCode: duplicatedSnippet,
      code: source,
      mode: "composition",
      onCodeChange
    });

    await user.click(screen.getByRole("button", { name: "Expand code" }));

    expect(onCodeChange.mock.lastCall?.[0]).toContain("<>");
    expect(onCodeChange.mock.lastCall?.[0]).toContain(
      '<Button color="success" variant="outlined">Two</Button>'
    );
    expect(onCodeChange.mock.lastCall?.[0]).toContain("</>");

    await user.click(screen.getByRole("button", { name: "Collapse code" }));

    expect(onCodeChange.mock.lastCall?.[0]).toBe(duplicatedSnippet);
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
