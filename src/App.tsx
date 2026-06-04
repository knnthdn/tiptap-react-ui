import RichTextEditor from "./components/editor/Tiptap";
import { ModeToggle } from "./components/mode-toggle";

import useTiptapEditor from "./hooks/useTiptapEditor";

export default function App() {
  const { editor } = useTiptapEditor({
    className: "max-h-[80vh]",
    handleImageUpload: {
      maxLimit: 10,
    },
  });

  return (
    <>
      <div className="max-w-5xl mx-auto py-5 space-y-1">
        <ModeToggle />
        <RichTextEditor editor={editor} enablePreview={true} />
      </div>
    </>
  );
}
