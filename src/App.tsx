import RichTextEditor from "./components/editor/Tiptap";

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
      <RichTextEditor
        editor={editor}
        enablePreview={true}
        className="max-w-5xl mx-auto space-y-1 py-5"
        theme="violet"
      />
    </>
  );
}
