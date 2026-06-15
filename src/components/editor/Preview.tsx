import { Button } from "../ui/button";
import { Editor } from "@tiptap/core";
import { useRef, useState } from "react";
import type { TableOfContentData } from "@tiptap/extension-table-of-contents";
import RenderHTMLPreview from "./RenderHTMLPreview";
import RenderJSONPreview from "./RenderJSONPreview";
import TableOfContentsPanel from "./TableOfContentsPanel";
import type { TableOfContentsPosition } from "./types/editors";
import { cn } from "../../lib/utils";
import { scrollTableOfContentsItemIntoView } from "./utils/scroll-toc-item";

export default function Preview({
  immediatelyRender = false,
  activePreview,
  onSetActivePreview,
  editor,
  enableTableOfContents = false,
  tableOfContentsPosition = "right",
}: {
  immediatelyRender?: boolean;
  activePreview: "json" | "html";
  editor: Editor;
  onSetActivePreview: React.Dispatch<React.SetStateAction<"json" | "html">>;
  enableTableOfContents?: boolean;
  tableOfContentsPosition?: TableOfContentsPosition;
}) {
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const [editorSetHeight] = useState<number>(editor.view.dom.offsetHeight);
  const [previewEditor, setPreviewEditor] = useState<Editor | null>(null);
  const [tableOfContentsItems, setTableOfContentsItems] =
    useState<TableOfContentData>([]);
  const showTableOfContents =
    enableTableOfContents &&
    activePreview === "json" &&
    tableOfContentsItems.length > 0;

  return (
    <div className="tr-preview w-full bg-background text-foreground border rounded-lg shadow-sm overflow-hidden">
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
        <div
          ref={previewScrollRef}
          className={cn(
            "flex max-h-[var(--editor-height)] flex-col overflow-y-auto",
            tableOfContentsPosition === "left"
              ? "lg:flex-row"
              : "lg:flex-row-reverse",
          )}
          style={
            { "--editor-height": `${editorSetHeight}px` } as React.CSSProperties
          }
        >
          {showTableOfContents && (
            <TableOfContentsPanel
              items={tableOfContentsItems}
              position={tableOfContentsPosition}
              className="lg:sticky lg:top-0 lg:self-start"
              showActiveState={false}
              onItemClick={(item) => {
                scrollTableOfContentsItemIntoView(
                  item,
                  previewEditor ?? item.editor,
                );
              }}
            />
          )}

          <div
            className={cn(
              "min-w-0 flex-1",
              showTableOfContents &&
                "pt-5 lg:pt-0",
              showTableOfContents &&
                (tableOfContentsPosition === "left" ? "lg:pl-6" : "lg:pr-6"),
            )}
          >
            <RenderJSONPreview
              content={editor.getJSON()}
              immediatelyRender={immediatelyRender}
              editorsClassName={cn(
                "px-6 py-5",
                showTableOfContents && "max-h-none overflow-y-visible",
              )}
              _height={showTableOfContents ? 0 : editorSetHeight}
              enableTableOfContents={enableTableOfContents}
              onTableOfContentsUpdate={setTableOfContentsItems}
              onEditorReady={setPreviewEditor}
              getTableOfContentsScrollParent={() =>
                previewScrollRef.current ?? window
              }
            />
          </div>
        </div>
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
