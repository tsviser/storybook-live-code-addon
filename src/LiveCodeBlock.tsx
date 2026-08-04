import {
  Fragment,
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { javascript } from "@codemirror/lang-javascript";
import { Compartment, EditorState, RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  keymap,
  ViewPlugin,
  type ViewUpdate
} from "@codemirror/view";
import { LiveProvider, LiveError, LivePreview } from "react-live";

export type LiveCodeMode = "minimal" | "composition";
export type LiveCodeTheme = "dark" | "light" | "system";
export type LiveCodeScope = Record<string, unknown>;

export type LiveCodeChangeContext = {
  isExpanded: boolean;
};

export type LiveCodeBlockProps = {
  collapsedCode: string;
  code: string;
  mode: LiveCodeMode;
  onCodeChange?: (code: string, context: LiveCodeChangeContext) => void;
  showPreview?: boolean;
  scope?: LiveCodeScope;
  sourcePath?: string;
  theme?: LiveCodeTheme;
  title: string;
};

type IconName = "chat" | "copy" | "fullscreen" | "more" | "reset" | "restore" | "vscode";
const themeOptions: LiveCodeTheme[] = ["system", "dark", "light"];

function getThemeLabel(themeOption: LiveCodeTheme) {
  return themeOption[0].toUpperCase() + themeOption.slice(1);
}

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

function isFullExampleSource(source: string) {
  return /export\s+default\s+function\s+[A-Za-z_$][\w$]*\s*\(/.test(source);
}

function getReturnSnippet(source: string) {
  const match = source.match(/return\s*\(\n([\s\S]*?)\n\s*\);/);

  return match ? unwrapFragment(match[1].replace(/^ {4}/gm, "").trim()) : stripImports(source);
}

function unwrapFragment(source: string) {
  const trimmed = source.trim();
  const match = trimmed.match(/^<>\n([\s\S]*)\n<\/>$/);

  return match ? match[1].replace(/^ {2}/gm, "").trim() : trimmed;
}

function hasSiblingJsxRoots(source: string) {
  const trimmed = unwrapFragment(source);
  let depth = 0;
  let rootCount = 0;
  const tagExpression = /<\/?\s*([A-Z][\w.]*|>)/g;
  let match: RegExpExecArray | null;

  while ((match = tagExpression.exec(trimmed))) {
    const tagText = match[0];

    if (tagText.startsWith("</")) {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (depth === 0) {
      rootCount += 1;
    }

    if (!tagText.endsWith("/>")) {
      depth += 1;
    }
  }

  return rootCount > 1;
}

function wrapSiblingRoots(source: string) {
  const snippet = unwrapFragment(source);

  return hasSiblingJsxRoots(snippet) ? `<>${"\n"}${indentSnippet(snippet, 2)}${"\n"}</>` : snippet;
}

function indentSnippet(source: string, spaces: number) {
  const indentation = " ".repeat(spaces);

  return source
    .trim()
    .split("\n")
    .map((line) => (line.trim() ? `${indentation}${line}` : ""))
    .join("\n");
}

function toExpandedSource(currentSource: string, expandedTemplate: string) {
  if (isFullExampleSource(currentSource)) {
    return currentSource;
  }

  const snippet = stripImports(currentSource);
  const returnSource = wrapSiblingRoots(snippet);

  if (!isFullExampleSource(expandedTemplate)) {
    return snippet;
  }

  return expandedTemplate.replace(
    /return\s*\(\n[\s\S]*?\n\s*\);/,
    `return (\n${indentSnippet(returnSource, 4)}\n  );`
  );
}

function toCollapsedSource(currentSource: string) {
  return isFullExampleSource(currentSource) ? getReturnSnippet(currentSource) : currentSource;
}

function toRenderableCode(source: string, mode: LiveCodeMode) {
  const codeWithoutImports = stripImports(source);
  const exportMatch = codeWithoutImports.match(
    /export\s+default\s+function\s+([A-Za-z_$][\w$]*)/
  );

  if (exportMatch) {
    return codeWithoutImports.replace("export default ", "") + `\n\nrender(<${exportMatch[1]} />);`;
  }

  return `render(<>\n${codeWithoutImports}\n</>);`;
}

const darkEditorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#1e1e1e",
      color: "#d4d4d4"
    },
    ".cm-activeLine": {
      backgroundColor: "#2a2d2e"
    },
    ".cm-cursor": {
      borderLeftColor: "#d4d4d4"
    },
    ".cm-gutters": {
      backgroundColor: "#1e1e1e",
      borderRightColor: "#333333",
      color: "#858585"
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "#264f78"
    }
  },
  { dark: true }
);

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

const componentNameMark = Decoration.mark({ class: "liveCode__syntaxComponent" });
const propKeyMark = Decoration.mark({ class: "liveCode__syntaxKey" });
const propValueMark = Decoration.mark({ class: "liveCode__syntaxValue" });
const keywordMark = Decoration.mark({ class: "liveCode__syntaxKeyword" });
const functionMark = Decoration.mark({ class: "liveCode__syntaxFunction" });
const moduleMark = Decoration.mark({ class: "liveCode__syntaxModule" });

type SyntaxRange = {
  from: number;
  mark: Decoration;
  priority: number;
  to: number;
};

function addRegexRanges(
  ranges: SyntaxRange[],
  source: string,
  expression: RegExp,
  mark: Decoration,
  priority: number,
  groupIndex = 0
) {
  let match: RegExpExecArray | null;

  while ((match = expression.exec(source))) {
    const value = match[groupIndex];

    if (!value) {
      continue;
    }

    const from = match.index + match[0].indexOf(value);

    ranges.push({ from, mark, priority, to: from + value.length });
  }
}

function addSyntaxRange(
  ranges: SyntaxRange[],
  from: number,
  to: number,
  mark: Decoration,
  priority: number
) {
  if (from < to) {
    ranges.push({ from, mark, priority, to });
  }
}

function buildJsxSnippetDecorations(view: EditorView) {
  const builder = new RangeSetBuilder<Decoration>();
  const source = view.state.doc.toString();
  const ranges: SyntaxRange[] = [];

  addRegexRanges(
    ranges,
    source,
    /\b(import|from|export|default|function|return|const|let|var)\b/g,
    keywordMark,
    1,
    1
  );
  addRegexRanges(ranges, source, /function\s+([A-Za-z_$][\w$]*)/g, functionMark, 2, 1);
  addRegexRanges(ranges, source, /from\s+("[^"]*"|'[^']*')/g, moduleMark, 2, 1);

  const tagExpression = /<\/?\s*[A-Z][^>\n]*(?:>|$)/g;
  let tagMatch: RegExpExecArray | null;

  while ((tagMatch = tagExpression.exec(source))) {
    const tagText = tagMatch[0];
    const tagStart = tagMatch.index;
    const componentMatch = tagText.match(/<\/?\s*([A-Z][\w.]*)/);

    if (componentMatch?.index !== undefined) {
      const componentStart = tagStart + componentMatch.index + componentMatch[0].lastIndexOf(componentMatch[1]);
      addSyntaxRange(
        ranges,
        componentStart,
        componentStart + componentMatch[1].length,
        componentNameMark,
        3
      );
    }

    const propExpression = /\s([A-Za-z_$][\w$:-]*)(\s*=\s*)("[^"]*"|'[^']*'|\{[^}\n]*\})/g;
    let propMatch: RegExpExecArray | null;

    while ((propMatch = propExpression.exec(tagText))) {
      const keyStart = tagStart + propMatch.index + propMatch[0].indexOf(propMatch[1]);
      const valueStart = keyStart + propMatch[1].length + propMatch[2].length;

      addSyntaxRange(ranges, keyStart, keyStart + propMatch[1].length, propKeyMark, 4);
      addSyntaxRange(
        ranges,
        valueStart,
        valueStart + propMatch[3].length,
        propValueMark,
        4
      );
    }
  }

  let previousTo = -1;

  ranges
    .sort((first, second) => first.from - second.from || second.priority - first.priority)
    .forEach(({ from, mark, to }) => {
      if (from < previousTo) {
        return;
      }

      builder.add(from, to, mark);
      previousTo = to;
    });

  return builder.finish();
}

const jsxSnippetHighlighting = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildJsxSnippetDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildJsxSnippetDecorations(update.view);
      }
    }
  },
  {
    decorations: (value) => value.decorations
  }
);

function getEditorThemeExtensions(resolvedTheme: Exclude<LiveCodeTheme, "system">) {
  return resolvedTheme === "dark" ? darkEditorTheme : lightEditorTheme;
}

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
          themeCompartmentRef.current.of(getEditorThemeExtensions(resolvedTheme)),
          jsxSnippetHighlighting,
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
      effects: themeCompartmentRef.current.reconfigure(getEditorThemeExtensions(resolvedTheme))
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
    strokeWidth: 2.5,
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

export function LiveCodePreview({
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
  onCodeChange,
  showPreview = true,
  scope = {},
  sourcePath,
  theme = "dark",
  title
}: LiveCodeBlockProps) {
  const [value, setValue] = useState(collapsedCode);
  const [isExpanded, setExpanded] = useState(false);
  const [isMaximized, setMaximized] = useState(false);
  const [isMoreMenuOpen, setMoreMenuOpen] = useState(false);
  const [themeOverride, setThemeOverride] = useState<LiveCodeTheme | null>(null);
  const activeTheme = themeOverride ?? theme;
  const resolvedTheme = useResolvedTheme(activeTheme);
  const vscodeHref = sourcePath ? `vscode://file${sourcePath}` : undefined;
  const editorHeight = getEditorHeight({ isExpanded, isMaximized, mode, value });
  const editorStyle = editorHeight
    ? ({ "--editor-height": `${editorHeight}px` } as CSSProperties)
    : undefined;
  const shouldShowPreview = showPreview || isMaximized;

  useEffect(() => {
    onCodeChange?.(value, { isExpanded });
  }, [isExpanded, onCodeChange, value]);

  return (
    <section
      aria-label={title}
      className="liveCode"
      data-maximized={isMaximized ? "true" : "false"}
      data-mode={mode}
      data-preview={shouldShowPreview ? "true" : "false"}
      data-theme={resolvedTheme}
    >
      {shouldShowPreview ? (
        <div className="liveCode__preview">
          <LiveCodePreview mode={mode} scope={scope} value={value} />
        </div>
      ) : null}

      <div className="liveCode__toolbar">
        <button className="liveCode__chatButton" type="button">
          <Icon name="chat" />
          Edit in Chat
        </button>
        <span className="liveCode__spacer" />
        <button
          type="button"
          onClick={() => {
            setValue((currentValue) =>
              isExpanded
                ? toCollapsedSource(currentValue)
                : toExpandedSource(currentValue, code)
            );
            setExpanded((expanded) => !expanded);
          }}
        >
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
            setValue(collapsedCode);
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
        <div className="liveCode__menuRoot">
          <button
            aria-expanded={isMoreMenuOpen}
            aria-haspopup="menu"
            aria-label="More actions"
            className="liveCode__iconButton"
            type="button"
            onClick={() => setMoreMenuOpen((isOpen) => !isOpen)}
          >
            <Icon name="more" />
            <TooltipLabel>More actions</TooltipLabel>
          </button>
          {isMoreMenuOpen ? (
            <div className="liveCode__menu" role="menu" aria-label="More actions">
              <div className="liveCode__menuLabel">Theme</div>
              {themeOptions.map((themeOption) => (
                <button
                  aria-checked={activeTheme === themeOption}
                  className="liveCode__menuItem"
                  key={themeOption}
                  role="menuitemradio"
                  type="button"
                  onClick={() => {
                    setThemeOverride(themeOption);
                    setMoreMenuOpen(false);
                  }}
                >
                  <span>{getThemeLabel(themeOption)}</span>
                  <span aria-hidden="true" className="liveCode__menuCheck">
                    {activeTheme === themeOption ? "Selected" : ""}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
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
