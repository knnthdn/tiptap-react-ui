import chroma from "chroma-js";
import { TextSelection } from "@tiptap/pm/state";
import { useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link2,
  Strikethrough,
  Underline,
} from "lucide-react";

import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";

type BubbleMenuProps = {
  editor: Editor;
  highlightColor: string;
};

function isReadable(fg: string, bg: string) {
  const ratio = chroma.contrast(fg, bg);
  return ratio >= 4.5;
}

function getReadableTextColor(background: string) {
  return isReadable("#ffffff", background) ? "#ffffff" : "#111827";
}

export default function BubbleMenu({
  editor,
  highlightColor,
}: BubbleMenuProps) {
  const [linkUrl, setLinkUrl] = useState("https://");
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

  const editorState = useEditorState({
    editor,
    selector: () => {
      return {
        //* MARKS
        isBold: editor.isActive("bold"),
        isItalic: editor.isActive("italic"),
        isUnderlined: editor.isActive("underline"),
        isStrike: editor.isActive("strike"),
        isLink: editor.isActive("link"),
        isHighlight: editor.isActive("highlight"),
        highlightColor: (editor.getAttributes("highlight").color ?? null) as
          | string
          | null,
        isHeading1: editor.isActive("heading", { level: 1 }),
        isHeading2: editor.isActive("heading", { level: 2 }),
        isHeading3: editor.isActive("heading", { level: 3 }),
      };
    },
  });

  const activeHighlightColor = editor.getAttributes("highlight").color as
    | string
    | undefined;
  const currentHighlightColor =
    activeHighlightColor && chroma.valid(activeHighlightColor)
      ? activeHighlightColor
      : highlightColor;

  const handleHighlightClick = () => {
    if (editor.isActive("highlight")) {
      editor.chain().focus().unsetHighlight().unsetColor().run();
      return;
    }

    const textColor = getReadableTextColor(currentHighlightColor);

    editor
      .chain()
      .focus()
      .setColor(textColor)
      .setHighlight({ color: currentHighlightColor })
      .run();
  };

  const handleLinkClick = () => {
    if (editorState.isLink) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    setLinkUrl(previousUrl ?? "https://");
    setIsLinkDialogOpen(true);
  };

  const handleSubmitLink = () => {
    const trimmedUrl = linkUrl.trim();

    if (!trimmedUrl) {
      editor.chain().focus().unsetLink().run();
      setIsLinkDialogOpen(false);
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: trimmedUrl })
      .run();
    setIsLinkDialogOpen(false);
  };

  return (
    <>
      <TiptapBubbleMenu
        editor={editor}
        updateDelay={300}
        shouldShow={({ editor: currentEditor, state }) => {
          const { selection } = state;
          const isTextSelection = selection instanceof TextSelection;
          const hasSelectedText = !selection.empty;

          return currentEditor.isEditable && isTextSelection && hasSelectedText;
        }}
        options={{
          placement: "bottom-start",
          offset: 8,
        }}
        className="flex items-center gap-0.5 rounded-lg border bg-background p-1 shadow-lg"
      >
        <BubbleButton
          title="Highlight"
          isActive={editorState.isHighlight}
          onClick={handleHighlightClick}
        >
          <span className="relative flex items-center">
            <Highlighter className="size-4" />
            <span
              className="absolute right-0 bottom-[-0.2rem] left-0 h-0.5 rounded-full"
              style={{ backgroundColor: currentHighlightColor }}
            />
          </span>
        </BubbleButton>

        <BubbleButton
          title="Bold"
          isActive={editorState.isBold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </BubbleButton>

        <BubbleButton
          title="Italic"
          isActive={editorState.isItalic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </BubbleButton>

        <BubbleButton
          title="Underline"
          isActive={editorState.isUnderlined}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="size-4" />
        </BubbleButton>

        <BubbleButton
          title="Strike"
          isActive={editorState.isStrike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </BubbleButton>

        <BubbleButton
          title="Insert link"
          isActive={editorState.isLink}
          onClick={handleLinkClick}
        >
          <Link2 className="size-4" />
        </BubbleButton>

        <BubbleButton
          title="Heading 1 (Ctrl + ALT + 1)"
          isActive={editorState.isHeading1}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="size-4" />
        </BubbleButton>

        <BubbleButton
          title="Heading 1 (Ctrl + ALT + 2)"
          isActive={editorState.isHeading2}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="size-4" />
        </BubbleButton>

        <BubbleButton
          title="Heading 1 (Ctrl + ALT + 3)"
          isActive={editorState.isHeading3}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="size-4" />
        </BubbleButton>
      </TiptapBubbleMenu>

      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert link</DialogTitle>
            <DialogDescription>
              Paste or type the URL you want to apply to the selected text.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmitLink();
            }}
            className="space-y-4"
          >
            <Input
              autoFocus
              type="url"
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              placeholder="https://example.com"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLinkDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Apply link</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

type BubbleButtonProps = {
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  title: string;
};

function BubbleButton({
  children,
  isActive,
  onClick,
  title,
}: BubbleButtonProps) {
  return (
    <Button
      type="button"
      size="icon"
      title={title}
      onClick={onClick}
      className={cn(
        "cursor-pointer bg-transparent",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-foreground",
      )}
    >
      {children}
    </Button>
  );
}
