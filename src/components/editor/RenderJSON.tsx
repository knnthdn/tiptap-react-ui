import { EditorContent } from "@tiptap/react";
import { cn } from "../../lib/utils";
import useTiptapEditor from "../../hooks/useTiptapEditor";
import { RenderJSONProps } from "./types/editors";

export default function RenderJSONPreview({
  content,
  immediatelyRender = true,
  contentClassName,
  editorsClassName,
}: RenderJSONProps) {
  const { editor } = useTiptapEditor({
    className: cn(editorsClassName),
    content,
    editable: false,
    isPreview: true,
    injectCSS: true,
    immediatelyRender,
  });

  if (!editor) return null;

  return (
    <div className={cn("overflow-hidden", contentClassName)}>
      <EditorContent editor={editor} />
    </div>
  );
}
