import { useEffect, useRef } from "react";
import { LiveCodeBlock, type LiveCodeBlockProps } from "./LiveCodeBlock";

export type LiveCodeDocsBlockProps = LiveCodeBlockProps & {
  replacePreviewActions?: boolean;
};

function findPreviousDocsPreview(element: HTMLElement) {
  let sibling = element.previousElementSibling;

  while (sibling) {
    if (sibling instanceof HTMLElement && sibling.classList.contains("sbdocs-preview")) {
      return sibling;
    }

    sibling = sibling.previousElementSibling;
  }

  return null;
}

export function LiveCodeDocsBlock({
  replacePreviewActions = true,
  showPreview = false,
  ...liveCodeProps
}: LiveCodeDocsBlockProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;

    if (!root || !replacePreviewActions) {
      return;
    }

    const preview = findPreviousDocsPreview(root);

    if (!preview) {
      return;
    }

    preview.classList.add("liveCodeDocsPreview");

    return () => preview.classList.remove("liveCodeDocsPreview");
  }, [replacePreviewActions]);

  return (
    <div className="liveCodeDocs" ref={rootRef}>
      <LiveCodeBlock showPreview={showPreview} {...liveCodeProps} />
    </div>
  );
}
