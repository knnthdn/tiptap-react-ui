import { HTMLContent } from "@tiptap/core";
import { cn } from "../../lib/utils";

export type _RenderHTMLProps = {
  content: HTMLContent;

  className?: string;

  style?: React.CSSProperties;
};
export default function RenderHTMLPreview({
  content,
  className,
  style,
}: _RenderHTMLProps) {
  return (
    <div
      className={cn(
        "tiptap text-left px-4 py-5 max-w-none w-full overflow-y-auto",
        className,
      )}
      style={style}
      dangerouslySetInnerHTML={{
        __html: content,
      }}
    />
  );
}
