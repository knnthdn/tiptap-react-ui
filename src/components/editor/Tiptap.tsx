import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
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
import type { RichTextEditorProps } from "./types/editors";
import { ThemeProvider, useTheme } from "../theme-provider";
import { ModeToggle } from "../mode-toggle";

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
  enableModeToggle = false,
  mode = "light",
  theme = "default",
  className,
}: RichTextEditorProps) {
  const [highlightColor, setHighlightColor] = useState("#ffcc00");
  const [activePreview, setActivePrev] = useState<"json" | "html">("json");
  const [modeResetKey, setModeResetKey] = useState(0);
  const previousEnableModeToggle = useRef(enableModeToggle);

  const hasOnSave = !!onSave;
  const { wordsCount, charactersCount } = useEditorState({
    editor,
    selector: (context) => ({
      charactersCount:
        context.editor?.storage?.characterCount?.characters?.() ?? 0,
      wordsCount: context.editor?.storage?.characterCount?.words?.() ?? 0,
    }),
  });

  useEffect(() => {
    if (previousEnableModeToggle.current !== enableModeToggle) {
      previousEnableModeToggle.current = enableModeToggle;
      setModeResetKey((key) => key + 1);
    }
  }, [enableModeToggle]);

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
    <ThemeProvider
      defaultTheme={mode}
      storageKey="tiptap-react-ui-theme-mode"
      enableStorage={enableModeToggle}
      resetThemeKey={modeResetKey > 0 ? modeResetKey : undefined}
    >
      <RichTextEditorContent
        activePreview={activePreview}
        charactersCount={charactersCount}
        className={className}
        editor={editor}
        enableModeToggle={enableModeToggle}
        enablePreview={enablePreview}
        enableWordCount={enableWordCount}
        highlightColor={highlightColor}
        immediatelyRenderPreview={immediatelyRenderPreview}
        onHighlightColorChange={setHighlightColor}
        onSetActivePreview={setActivePrev}
        onUserSaveAction={onUserSaveAction}
        hasOnSave={hasOnSave}
        theme={theme}
        wordsCount={wordsCount}
      />
    </ThemeProvider>
  );
}

type RichTextEditorContentProps = {
  activePreview: "json" | "html";
  charactersCount: number;
  className?: string;
  editor: NonNullable<RichTextEditorProps["editor"]>;
  enableModeToggle: boolean;
  enablePreview: boolean;
  enableWordCount: boolean;
  hasOnSave: boolean;
  highlightColor: string;
  immediatelyRenderPreview: boolean;
  onHighlightColorChange: (color: string) => void;
  onSetActivePreview: Dispatch<SetStateAction<"json" | "html">>;
  onUserSaveAction: () => void;
  theme: NonNullable<RichTextEditorProps["theme"]>;
  wordsCount: number;
};

function RichTextEditorContent({
  activePreview,
  charactersCount,
  className,
  editor,
  enableModeToggle,
  enablePreview,
  enableWordCount,
  hasOnSave,
  highlightColor,
  immediatelyRenderPreview,
  onHighlightColorChange,
  onSetActivePreview,
  onUserSaveAction,
  theme,
  wordsCount,
}: RichTextEditorContentProps) {
  const { resolvedTheme } = useTheme();
  const now = new Date();
  const hasFullHeightLayout =
    !!className && /\bh-(full|screen|dvh|svh|lvh)\b/.test(className);

  return (
    <div
      className={cn(
        hasFullHeightLayout && "h-full",
        resolvedTheme === "dark" && "dark",
      )}
    >
      <Tabs
        defaultValue="edit"
        className={cn(
          "w-full tr-editor bg-transparent",
          hasFullHeightLayout && "flex h-full min-h-0 flex-col",
          className,
        )}
        data-theme={theme}
      >
        {(enablePreview || enableModeToggle) && (
          <div
            className={cn(
              "flex w-full items-center",
              enablePreview ? "justify-between" : "justify-end",
            )}
          >
            {enablePreview && (
              <TabsList>
                <TabsTrigger value="edit">Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            )}

            {enableModeToggle && (
              <div>
                <ModeToggle />
              </div>
            )}
          </div>
        )}

        <TabsContent
          value="edit"
          className={cn("w-full", hasFullHeightLayout && "min-h-0 flex-1")}
        >
          <div
            className={cn(
              "editor-shell relative flex flex-col",
              hasFullHeightLayout && "h-full min-h-0",
            )}
          >
            <Menubar
              editor={editor}
              highlightColor={highlightColor}
              onHighlightColorChange={onHighlightColorChange}
              handleUserSaveAction={onUserSaveAction}
              hasOnSave={hasOnSave}
            />

            <div
              className={cn(
                hasFullHeightLayout && "flex min-h-0 flex-1 flex-col",
              )}
            >
              <BubbleMenu editor={editor} highlightColor={highlightColor} />
              <YoutubeBubbleMenu editor={editor} />

              <EditorContent
                editor={editor}
                className={cn(
                  "bg-background",
                  hasFullHeightLayout &&
                    "min-h-0 flex-1 [&>.tiptap]:max-h-full",
                )}
              />

              {/* WORD COUNT  */}
              {enableWordCount && (
                <div className="bg-muted py-1.5 px-3 rounded-b-sm border border-t-0 flex shrink-0 gap-2.5 flex-wrap justify-between items-center">
                  <div className="flex gap-2.5 items-center">
                    <span className="block p-1 rounded bg-background/70 text-muted-foreground">
                      <CaseSensitiveIcon className="size-4" />
                    </span>

                    <span className="block text-xs text-muted-foreground">
                      {wordsCount} word
                    </span>

                    <span className="text-muted-foreground">|</span>

                    <span className="block text-xs text-muted-foreground">
                      {charactersCount} characters
                    </span>
                  </div>

                  <span className="block text-xs text-muted-foreground">
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
              onSetActivePreview={onSetActivePreview}
              editor={editor}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
