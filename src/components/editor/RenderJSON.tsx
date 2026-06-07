import { EditorContent } from "@tiptap/react";
import { cn } from "../../lib/utils";
import useTiptapEditor from "../../hooks/useTiptapEditor";
import { RenderJSONProps } from "./types/editors";

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
  immediatelyRender = true,
  contentClassName,
  editorsClassName,
  mode = "system",
}: RenderJSONProps) {
  const { editor } = useTiptapEditor({
    className: cn("max-h-none overflow-y-visible", editorsClassName),
    content,
    editable: false,
    isPreview: true,
    injectCSS: true,
    immediatelyRender,
  });

  if (!editor) return null;

  return (
    <div
      className={cn(
        "tr-editor bg-transparent",
        mode === "dark" && "dark",
        contentClassName,
      )}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
