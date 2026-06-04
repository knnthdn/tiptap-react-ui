import { cn } from "../../lib/utils";
import { RenderHTMLProps } from "./types/editors";

/**
 * Component for rendering HTML content generated from Tiptap `editor.getHTML()`.
 *
 * This component is used to safely render serialized HTML output in a
 * read-only context such as:
 * - blog previews
 * - published content pages etc.
 */
export default function RenderHTML({
  content,
  className,
  sanitize,
}: RenderHTMLProps) {
  const output = sanitize ? sanitize(content) : content;
  return (
    <div
      className={cn(
        "tiptap px-4 py-5 max-w-none w-full overflow-y-auto",
        className,
      )}
      dangerouslySetInnerHTML={{
        __html: output,
      }}
    />
  );
}
