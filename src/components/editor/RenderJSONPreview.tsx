import { EditorContent, JSONContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import type { TableOfContentData } from "@tiptap/extension-table-of-contents";
import { useEffect } from "react";
import { cn } from "../../lib/utils";
import useTiptapEditor from "../../hooks/useTiptapEditor";

export type RenderJSONProps = {
  content: JSONContent;

  immediatelyRender?: boolean;

  contentClassName?: string;

  editorsClassName?: string;
  _height?: number;
  enableTableOfContents?: boolean;
  onTableOfContentsUpdate?: (items: TableOfContentData) => void;
  onEditorReady?: (editor: Editor | null) => void;
  getTableOfContentsScrollParent?: () => HTMLElement | Window;
};

export default function RenderJSONPreview({
  content,
  immediatelyRender = false,
  contentClassName,
  editorsClassName,
  _height = 0,
  enableTableOfContents = false,
  onTableOfContentsUpdate,
  onEditorReady,
  getTableOfContentsScrollParent,
}: RenderJSONProps) {
  const { editor } = useTiptapEditor({
    className: cn(editorsClassName, _height && "max-h-[var(--editor-height)]"),
    content,
    editable: false,
    isPreview: true,
    injectCSS: true,
    immediatelyRender,
    tableOfContents:
      enableTableOfContents && onTableOfContentsUpdate
        ? {
            onUpdate: onTableOfContentsUpdate,
            scrollParent: () => getTableOfContentsScrollParent?.() ?? window,
          }
        : undefined,
  });

  useEffect(() => {
    onEditorReady?.(editor);

    return () => {
      onEditorReady?.(null);
    };
  }, [editor, onEditorReady]);

  if (!editor) return null;

  return (
    <div
      className={cn("overflow-hidden", contentClassName)}
      style={{ "--editor-height": `${_height}px` } as React.CSSProperties}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
