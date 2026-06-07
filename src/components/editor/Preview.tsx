import { Button } from "../ui/button";
import { Editor } from "@tiptap/core";
import { useState } from "react";
import RenderHTMLPreview from "./RenderHTMLPreview";
import RenderJSONPreview from "./RenderJSONPreview";

export default function Preview({
  immediatelyRender = true,
  activePreview,
  onSetActivePreview,
  editor,
}: {
  immediatelyRender?: boolean;
  activePreview: "json" | "html";
  editor: Editor;
  onSetActivePreview: React.Dispatch<React.SetStateAction<"json" | "html">>;
}) {
  const [editorSetHeight] = useState<number>(editor.view.dom.offsetHeight);

  return (
    <div className="tr-editor w-full bg-background text-foreground border rounded-lg shadow-sm overflow-hidden">
      {/* Header bar (same design as before) */}
      <div className="flex justify-between items-center px-3 py-2 border-b text-xs text-muted-foreground">
        <div className=" flex items-center gap-2 ">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="ml-2">Preview</span>
        </div>

        <div className="space-x-1.5">
          <Button
            className="text-xs"
            size={"xs"}
            variant={activePreview === "json" ? "default" : "outline"}
            onClick={() => onSetActivePreview("json")}
          >
            JSON
          </Button>

          <Button
            className="text-xs"
            size={"xs"}
            variant={activePreview === "html" ? "default" : "outline"}
            onClick={() => onSetActivePreview("html")}
          >
            HTML
          </Button>
        </div>
      </div>

      {activePreview === "json" ? (
        <RenderJSONPreview
          content={editor.getJSON()}
          immediatelyRender={immediatelyRender}
          editorsClassName="px-6 py-5"
          _height={editorSetHeight}
        />
      ) : (
        <RenderHTMLPreview
          content={editor.getHTML()}
          className={"px-6 py-5"}
          style={{ maxHeight: `${editorSetHeight}px` }}
        />
      )}
    </div>
  );
}
