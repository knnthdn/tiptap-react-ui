import { EditorContent, JSONContent } from "@tiptap/react";
import { cn } from "../../lib/utils";
import useTiptapEditor from "../../hooks/useTiptapEditor";

export type RenderJSONProps = {
  content: JSONContent;

  immediatelyRender?: boolean;

  contentClassName?: string;

  editorsClassName?: string;
  _height?: number;
};

export default function RenderJSONPreview({
  content,
  immediatelyRender = true,
  contentClassName,
  editorsClassName,
  _height = 0,
}: RenderJSONProps) {
  const { editor } = useTiptapEditor({
    className: cn(editorsClassName, _height && "max-h-[var(--editor-height)]"),
    content,
    editable: false,
    isPreview: true,
    injectCSS: true,
    immediatelyRender,
  });

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
