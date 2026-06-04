import { useState } from "react";
import { EditorContent, useEditorState } from "@tiptap/react";

//* NODES
import DragHandle from "@tiptap/extension-drag-handle-react";

//* CUSTOM IMPORTS
import BubbleMenu from "../editor/BubbleMenu";
import Menubar from "../editor/Menubar";
import YoutubeBubbleMenu from "../editor/YoutubeBubbleMenu";
import { CaseSensitiveIcon, GripVertical } from "lucide-react";
import { cn, formatDate } from "../../lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import Preview from "./Preview";
import { RichTextEditorProps } from "./types/editors";

/**
 * This component is responsible for showing Editors UI.
 *
 * Features:
 * - Content generated preview
 * - Word count
 * - Save callbacks
 */
export default function RichtextEditor({
  editor,
  onSave,
  enablePreview = false,
  enableWordCount = true,
  immediatelyRenderPreview = true,
  className,
}: RichTextEditorProps) {
  const [highlightColor, setHighlightColor] = useState("#ffcc00");
  const [activePreview, setActivePrev] = useState<"json" | "html">("json");

  const hasOnSave = !!onSave;
  const now = new Date();

  const { wordsCount, charactersCount } = useEditorState({
    editor,
    selector: (context) => ({
      charactersCount:
        context.editor?.storage?.characterCount?.characters?.() ?? 0,
      wordsCount: context.editor?.storage?.characterCount?.words?.() ?? 0,
    }),
  });

  if (!editor) return null;

  function onUserSaveAction() {
    if (!hasOnSave) return;

    const payload = {
      html: editor.getHTML(),
      json: editor.getJSON(),
    };

    onSave(payload);
  }

  return (
    <Tabs defaultValue="edit" className="w-full tr-editor">
      {enablePreview && (
        <TabsList>
          <TabsTrigger value="edit">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
      )}

      <TabsContent value="edit" className="w-full">
        <div className="editor-shell relative flex flex-col">
          <Menubar
            editor={editor}
            highlightColor={highlightColor}
            onHighlightColorChange={setHighlightColor}
            handleUserSaveAction={onUserSaveAction}
            hasOnSave={hasOnSave}
          />

          <div>
            <BubbleMenu editor={editor} highlightColor={highlightColor} />
            <YoutubeBubbleMenu editor={editor} />

            <EditorContent editor={editor} className={cn(className)} />

            {/* WORD COUNT  */}
            {enableWordCount && (
              <div className="bg-gray-100 py-1.5 px-3 rounded-b-sm border border-t-0 dark:bg-[#171717] flex gap-2.5 flex-wrap justify-between items-center">
                <div className="flex gap-2.5 items-center">
                  <span className="block p-1 rounded bg-gray-300/80 dark:bg-gray-700">
                    <CaseSensitiveIcon className="size-4 text-gray-500 dark:text-gray-200" />
                  </span>

                  <span className="block text-xs text-gray-500 dark:text-gray-300">
                    {wordsCount} word
                  </span>

                  <span className="text-gray-500">|</span>

                  <span className="block text-xs text-gray-500 dark:text-gray-300">
                    {charactersCount} characters
                  </span>
                </div>

                <span className="block text-xs text-gray-500 dark:text-gray-300">
                  {formatDate(new Date(now))}
                </span>
              </div>
            )}

            <DragHandle
              editor={editor}
              className="drag-handle-react z-5000"
              computePositionConfig={{
                placement: "right",
                strategy: "absolute",
              }}
              nested={{
                edgeDetection: "right",
                rules: [
                  {
                    id: "excludeTablesCompletely",
                    evaluate: ({ node, parent }) => {
                      const isTableStructure = [
                        "tableRow",
                        "tableCell",
                        "tableHeader",
                      ].includes(node.type.name);
                      const isInsideTable =
                        parent?.type.name === "tableCell" ||
                        parent?.type.name === "tableHeader" ||
                        parent?.type.name === "tableRow";

                      // Exclude table structure nodes, and also exclude any nested content
                      // inside table cells/headers/rows so the handle never shows per cell.
                      return isTableStructure || isInsideTable ? 1000 : 0;
                    },
                  },
                ],
              }}
            >
              <button
                type="button"
                tabIndex={-1}
                aria-label="Drag block"
                className="drag-handle-button flex cursor-grab items-center justify-center text-muted-foreground transition hover:text-accent-foreground "
              >
                <GripVertical className="size-4" />
              </button>
            </DragHandle>
          </div>
        </div>
      </TabsContent>

      {enablePreview && (
        <TabsContent value="preview" className="w-full">
          <Preview
            immediatelyRender={immediatelyRenderPreview}
            activePreview={activePreview}
            onSetActivePreview={setActivePrev}
            editor={editor}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
