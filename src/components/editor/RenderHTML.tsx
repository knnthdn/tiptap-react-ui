import { cn } from "../../lib/utils";
import { RenderHTMLProps } from "./types/editors";

/**
 * Renders serialized HTML generated from Tiptap `editor.getHTML()`.
 *
 * `RenderHTML` intentionally renders a raw HTML surface with the base
 * `tr-editor`, `tiptap`, `text-left`, and `bg-transparent` classes by default.
 * Add padding, width, typography, borders, or scrolling through `className`.
 *
 * Pass `mode="dark"` when the rendered output should use the editor's dark
 * mode CSS variables.
 *
 * If the HTML comes from users or external systems, pass a `sanitize` function
 * before rendering.
 *
 * @example
 * ```tsx
 * <RenderHTML
 *   content={post.html}
 *   className="prose max-w-none"
 *   mode="dark"
 *   sanitize={(html) => DOMPurify.sanitize(html)}
 * />
 * ```
 */
export default function RenderHTML({
  content,
  className,
  mode = "system",
  sanitize,
}: RenderHTMLProps) {
  const output = sanitize ? sanitize(content) : content;
  return (
    <div
      className={cn(
        "tr-editor tiptap text-left bg-transparent",
        mode === "dark" && "dark",
        className,
      )}
      dangerouslySetInnerHTML={{
        __html: output,
      }}
    />
  );
}
