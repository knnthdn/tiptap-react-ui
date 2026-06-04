import { NodeSelection } from "@tiptap/pm/state";
import { type Editor, useEditorState } from "@tiptap/react";
import { createPortal } from "react-dom";
import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
} from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

type YoutubeAlign = "left" | "center" | "right";

type YoutubeBubbleMenuProps = {
  editor: Editor;
};

export default function YoutubeBubbleMenu({ editor }: YoutubeBubbleMenuProps) {
  const { alignment, isYoutubeSelected, isFullWidth, nodePos } = useEditorState(
    {
      editor,
      selector: () => ({
        alignment: (editor.getAttributes("youtube").alignment ??
          "center") as YoutubeAlign,
        isYoutubeSelected:
          editor.state.selection instanceof NodeSelection &&
          editor.state.selection.node.type.name === "youtube",
        isFullWidth: String(editor.getAttributes("youtube").width) === "100%",
        nodePos:
          editor.state.selection instanceof NodeSelection
            ? editor.state.selection.from
            : null,
      }),
    },
  );

  const setAlign = (value: YoutubeAlign) => {
    editor
      .chain()
      .focus()
      .updateAttributes("youtube", { alignment: value })
      .run();
  };

  if (
    !isYoutubeSelected ||
    isFullWidth ||
    nodePos === null ||
    !editor.isEditable
  ) {
    return null;
  }

  const selectedDom = editor.view.nodeDOM(nodePos);
  const hostElement =
    selectedDom instanceof HTMLElement &&
    selectedDom.matches("div[data-youtube-video]")
      ? selectedDom
      : selectedDom instanceof HTMLElement
        ? selectedDom.closest("div[data-youtube-video]")
        : null;

  if (!hostElement) {
    return null;
  }

  return createPortal(
    <div className="absolute top-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-md border bg-background/95 p-1 shadow-md backdrop-blur-sm">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        title="Align left"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setAlign("left")}
        className={cn(
          "h-7 w-7 cursor-pointer",
          alignment === "left" && "bg-foreground text-background",
        )}
      >
        <AlignHorizontalJustifyStart className="size-3.5" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        title="Align center"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setAlign("center")}
        className={cn(
          "h-7 w-7 cursor-pointer",
          alignment === "center" && "bg-foreground text-background",
        )}
      >
        <AlignHorizontalJustifyCenter className="size-3.5" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        title="Align right"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setAlign("right")}
        className={cn(
          "h-7 w-7 cursor-pointer",
          alignment === "right" && "bg-foreground text-background",
        )}
      >
        <AlignHorizontalJustifyEnd className="size-3.5" />
      </Button>
    </div>,
    hostElement,
  );
}
