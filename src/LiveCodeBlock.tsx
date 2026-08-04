import {
  Fragment,
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { javascript } from "@codemirror/lang-javascript";
import { Compartment, EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap } from "@codemirror/view";
import { LiveProvider, LiveError, LivePreview } from "react-live";

export type LiveCodeMode = "minimal" | "composition";
export type LiveCodeTheme = "dark" | "light" | "system";
export type LiveCodeScope = Record<string, unknown>;

export type LiveCodeBlockProps = {
  collapsedCode: string;
  code: string;
  mode: LiveCodeMode;
  scope?: LiveCodeScope;
  sourcePath?: string;
  theme?: LiveCodeTheme;
  title: string;
};

type IconName = "chat" | "copy" | "fullscreen" | "more" | "reset" | "restore" | "vscode";

function getEditorHeight({
  isExpanded,
  isMaximized,
  mode,
  value
}: {
  isExpanded: boolean;
  isMaximized: boolean;
  mode: LiveCodeMode;
  value: string;
}) {
  if (isMaximized) {
    return undefined;
  }

  const lineCount = value.split("\n").length;
  const contentHeight = lineCount * 26 + 52;
  const minHeight = isExpanded ? 180 : 118;
  const maxHeight = isExpanded ? (mode === "composition" ? 560 : 440) : 220;

  return Math.max(minHeight, Math.min(contentHeight, maxHeight));
}

function stripImports(source: string) {
  return source
    .split("\n")
    .filter((line) => !line.trim().startsWith("import "))
    .join("\n")
    .trim();
}

function toRenderableCode(source: string, mode: LiveCodeMode) {
  const codeWithoutImports = stripImports(source);
  const exportMatch = codeWithoutImports.match(
    /export\s+default\s+function\s+([A-Za-z_$][\w$]*)/
  );

  if (exportMatch) {
    return codeWithoutImports.replace("export default ", "") + `\n\nrender(<${exportMatch[1]} />);`;
  }

  if (mode === "minimal") {
    return `render(<>\n${codeWithoutImports}\n</>);`;
  }

  return `render(${codeWithoutImports});`;
}

const lightEditorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#ffffff",
      color: "#24292f"
    },
    ".cm-activeLine": {
      backgroundColor: "#f6f8fa"
    },
    ".cm-cursor": {
      borderLeftColor: "#24292f"
    },
    ".cm-gutters": {
      backgroundColor: "#ffffff",
      borderRightColor: "#d0d7de",
      color: "#57606a"
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "#b6d7ff"
    }
  },
  { dark: false }
);

function useResolvedTheme(theme: LiveCodeTheme) {
  const [systemTheme, setSystemTheme] = useState<Exclude<LiveCodeTheme, "system">>("dark");

  useEffect(() => {
    if (theme !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const updateTheme = () => setSystemTheme(media.matches ? "light" : "dark");

    updateTheme();
    media.addEventListener("change", updateTheme);

    return () => media.removeEventListener("change", updateTheme);
  }, [theme]);

  return theme === "system" ? systemTheme : theme;
}

function CodeMirrorEditor({
  resolvedTheme,
  title,
  value,
  onChange
}: {
  onChange: (value: string) => void;
  resolvedTheme: Exclude<LiveCodeTheme, "system">;
  title: string;
  value: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const themeCompartmentRef = useRef(new Compartment());

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) {
      return;
    }

    const editor = new EditorView({
      parent: containerRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          keymap.of([]),
          javascript({ jsx: true, typescript: true }),
          themeCompartmentRef.current.of(
            resolvedTheme === "dark" ? oneDark : lightEditorTheme
          ),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          })
        ]
      })
    });

    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.dispatch({
      effects: themeCompartmentRef.current.reconfigure(
        resolvedTheme === "dark" ? oneDark : lightEditorTheme
      )
    });
  }, [resolvedTheme]);

  useEffect(() => {
    const editor = editorRef.current;

    if (editor && editor.state.doc.toString() !== value) {
      editor.dispatch({
        changes: {
          from: 0,
          to: editor.state.doc.length,
          insert: value
        }
      });
    }
  }, [value]);

  return (
    <div
      aria-label={title}
      className="liveCode__codeMirror"
      ref={containerRef}
      role="textbox"
    />
  );
}

function Icon({ name }: { name: IconName }) {
  const shared = {
    "aria-hidden": true,
    className: "liveCode__icon",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 2,
    viewBox: "0 0 24 24"
  } as const;

  if (name === "chat") {
    return (
      <svg {...shared}>
        <path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3z" />
        <path d="M5 14l.9 2.1L8 17l-2.1.9L5 20l-.9-2.1L2 17l2.1-.9L5 14z" />
      </svg>
    );
  }

  if (name === "copy") {
    return (
      <svg {...shared}>
        <rect height="13" rx="2" width="10" x="8" y="7" />
        <path d="M6 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
      </svg>
    );
  }

  if (name === "fullscreen") {
    return (
      <svg {...shared}>
        <path d="M8 3H5a2 2 0 0 0-2 2v3" />
        <path d="M16 3h3a2 2 0 0 1 2 2v3" />
        <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
        <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
      </svg>
    );
  }

  if (name === "restore") {
    return (
      <svg {...shared}>
        <path d="M8 3v3a2 2 0 0 1-2 2H3" />
        <path d="M16 3v3a2 2 0 0 0 2 2h3" />
        <path d="M8 21v-3a2 2 0 0 0-2-2H3" />
        <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
      </svg>
    );
  }

  if (name === "reset") {
    return (
      <svg {...shared}>
        <path d="M21 12a9 9 0 1 1-2.6-6.4" />
        <path d="M21 4v6h-6" />
      </svg>
    );
  }

  if (name === "vscode") {
    return (
      <svg {...shared}>
        <path d="M16 4l4 2v12l-4 2-8-6-3 2-2-1.5v-5L5 8l3 2 8-6z" />
        <path d="M16 4v16" />
      </svg>
    );
  }

  return (
    <svg {...shared}>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function TooltipLabel({ children }: { children: string }) {
  return <span className="liveCode__tooltip">{children}</span>;
}

function LiveCodePreview({
  mode,
  scope,
  value
}: {
  mode: LiveCodeMode;
  scope: LiveCodeScope;
  value: string;
}) {
  const renderableCode = useMemo(() => toRenderableCode(value, mode), [mode, value]);

  return (
    <LiveProvider
      code={renderableCode}
      noInline
      scope={{ Fragment, ...scope }}
    >
      <div className="liveCode__previewInner">
        <LivePreview />
      </div>
      <LiveError className="liveCode__previewError" />
    </LiveProvider>
  );
}

export function LiveCodeBlock({
  collapsedCode,
  code,
  mode,
  scope = {},
  sourcePath,
  theme = "dark",
  title
}: LiveCodeBlockProps) {
  const [collapsedValue, setCollapsedValue] = useState(collapsedCode);
  const [expandedValue, setExpandedValue] = useState(code);
  const [isExpanded, setExpanded] = useState(false);
  const [isMaximized, setMaximized] = useState(false);
  const value = isExpanded ? expandedValue : collapsedValue;
  const setValue = isExpanded ? setExpandedValue : setCollapsedValue;
  const resolvedTheme = useResolvedTheme(theme);
  const vscodeHref = sourcePath ? `vscode://file${sourcePath}` : undefined;
  const editorHeight = getEditorHeight({ isExpanded, isMaximized, mode, value });
  const editorStyle = editorHeight
    ? ({ "--editor-height": `${editorHeight}px` } as CSSProperties)
    : undefined;

  return (
    <section
      aria-label={title}
      className="liveCode"
      data-maximized={isMaximized ? "true" : "false"}
      data-mode={mode}
      data-theme={resolvedTheme}
    >
      <div className="liveCode__preview">
        <LiveCodePreview mode={mode} scope={scope} value={value} />
      </div>

      <div className="liveCode__toolbar">
        <button className="liveCode__chatButton" type="button">
          <Icon name="chat" />
          Edit in Chat
        </button>
        {isExpanded ? (
          <div className="liveCode__tabs" role="tablist" aria-label="Language">
            <button aria-selected="true" role="tab" type="button">
              JS
            </button>
            <button aria-selected="false" role="tab" type="button">
              TS
            </button>
          </div>
        ) : null}
        <span className="liveCode__spacer" />
        <button type="button" onClick={() => setExpanded((expanded) => !expanded)}>
          {isExpanded ? "Collapse code" : "Expand code"}
        </button>
        <button
          aria-label="Copy code"
          className="liveCode__iconButton"
          type="button"
          onClick={() => navigator.clipboard?.writeText(value)}
        >
          <Icon name="copy" />
          <TooltipLabel>Copy code</TooltipLabel>
        </button>
        <button
          aria-label={isMaximized ? "Exit full screen" : "Full screen"}
          className="liveCode__iconButton"
          type="button"
          onClick={() => setMaximized((maximized) => !maximized)}
        >
          <Icon name={isMaximized ? "restore" : "fullscreen"} />
          <TooltipLabel>{isMaximized ? "Exit full screen" : "Full screen"}</TooltipLabel>
        </button>
        <button
          aria-label="Reset code"
          className="liveCode__iconButton"
          type="button"
          onClick={() => {
            setCollapsedValue(collapsedCode);
            setExpandedValue(code);
          }}
        >
          <Icon name="reset" />
          <TooltipLabel>Reset code</TooltipLabel>
        </button>
        {vscodeHref ? (
          <a
            aria-label="Open source in VS Code"
            className="liveCode__iconButton"
            href={vscodeHref}
          >
            <Icon name="vscode" />
            <TooltipLabel>Open source in VS Code</TooltipLabel>
          </a>
        ) : null}
        <button aria-label="More actions" className="liveCode__iconButton" type="button">
          <Icon name="more" />
          <TooltipLabel>More actions</TooltipLabel>
        </button>
      </div>

      <div
        className="liveCode__editorShell"
        data-expanded={isExpanded ? "true" : "false"}
        style={editorStyle}
      >
        <CodeMirrorEditor
          resolvedTheme={resolvedTheme}
          title={`${title} editable code`}
          value={value}
          onChange={setValue}
        />
      </div>
    </section>
  );
}
