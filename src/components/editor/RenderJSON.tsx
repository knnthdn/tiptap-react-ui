import { EditorContent } from "@tiptap/react";
import type { TableOfContentData } from "@tiptap/extension-table-of-contents";
import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import useTiptapEditor from "../../hooks/useTiptapEditor";
import { RenderJSONProps } from "./types/editors";
import TableOfContentsPanel from "./TableOfContentsPanel";
import { scrollTableOfContentsItemIntoView } from "./utils/scroll-toc-item";

/**
 * Renders a saved Tiptap JSON document in a read-only editor surface.
 *
 * Use this component when you store editor content as `editor.getJSON()` and
 * want to render it later while preserving Tiptap-specific nodes, marks,
 * tables, images, task lists, and other document structure.
 *
 * By default, the rendered editor uses `max-h-none` and `overflow-y-visible`
 * so the parent layout controls scrolling.
 *
 * Pass `mode="dark"` when the rendered output should use the editor's dark
 * mode CSS variables.
 *
 * @example
 * ```tsx
 * <RenderJSON
 *   content={post.content}
 *   contentClassName="prose max-w-none"
 *   editorsClassName="p-0"
 *   mode="dark"
 * />
 * ```
 */
export default function RenderJSONPreview({
  content,
  immediatelyRender = false,
  contentClassName,
  editorsClassName,
  mode = "system",
  enableTableOfContents = false,
  tableOfContentsPosition = "right",
}: RenderJSONProps) {
  const tocSlotRef = useRef<HTMLDivElement | null>(null);
  const [fixedTocStyle, setFixedTocStyle] = useState<React.CSSProperties>();
  const [tableOfContentsItems, setTableOfContentsItems] =
    useState<TableOfContentData>([]);
  const { editor } = useTiptapEditor({
    className: cn("max-h-none overflow-y-visible", editorsClassName),
    content,
    editable: false,
    isPreview: true,
    injectCSS: true,
    immediatelyRender,
    tableOfContents: enableTableOfContents
      ? {
          onUpdate: setTableOfContentsItems,
        }
      : undefined,
  });

  useEffect(() => {
    if (!enableTableOfContents) return;

    const updateFixedTocPosition = () => {
      const slot = tocSlotRef.current;
      if (!slot || !window.matchMedia("(min-width: 1024px)").matches) {
        setFixedTocStyle(undefined);
        return;
      }

      const rect = slot.getBoundingClientRect();

      setFixedTocStyle({
        left: `${rect.left}px`,
        maxHeight: `calc(100dvh - ${Math.max(rect.top, 0)}px - 1rem)`,
        top: `${Math.max(rect.top, 0)}px`,
        width: `${rect.width}px`,
      });
    };

    updateFixedTocPosition();
    window.addEventListener("resize", updateFixedTocPosition);

    return () => {
      window.removeEventListener("resize", updateFixedTocPosition);
    };
  }, [enableTableOfContents, tableOfContentsItems.length]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "tr-editor bg-transparent",
        mode === "dark" && "dark",
        contentClassName,
      )}
    >
      {enableTableOfContents ? (
        <div
          className={cn(
            "flex flex-col bg-background",
            tableOfContentsPosition === "left"
              ? "lg:flex-row"
              : "lg:flex-row-reverse",
          )}
        >
          <div ref={tocSlotRef} className="shrink-0 lg:w-64">
            <TableOfContentsPanel
              items={tableOfContentsItems}
              position={tableOfContentsPosition}
              className="lg:fixed lg:z-10 lg:overflow-y-auto"
              style={fixedTocStyle}
              onItemClick={(item) => {
                scrollTableOfContentsItemIntoView(item, editor);
              }}
            />
          </div>
          <div
            className={cn(
              "min-w-0 flex-1 pt-5 lg:pt-0",
              tableOfContentsPosition === "left" ? "lg:pl-6" : "lg:pr-6",
            )}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}
