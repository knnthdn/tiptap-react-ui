import { useMemo, useState } from "react";
import { TextSelection } from "@tiptap/pm/state";
import { useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  ChevronDown,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  MoreVertical,
  Pilcrow,
  Quote,
  Strikethrough,
  Underline,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";

type NotionBubbleMenuProps = {
  editor: Editor;
};

type ActiveBubbleMenu = "color" | "more" | "turn" | null;

export const NOTION_BUBBLE_MENU_PLUGIN_KEY = "notionBubbleMenu";

const TEXT_COLORS = [
  "#374151",
  "#6b7280",
  "#92400e",
  "#c2410c",
  "#a16207",
  "#047857",
  "#0284c7",
  "#7c3aed",
  "#db2777",
  "#dc2626",
];

const HIGHLIGHT_COLORS = [
  "#f3f4f6",
  "#e5e7eb",
  "#f5e9dc",
  "#fed7aa",
  "#fef08a",
  "#bbf7d0",
  "#bae6fd",
  "#e9d5ff",
  "#fce7f3",
  "#fee2e2",
];

export default function NotionBubbleMenu({ editor }: NotionBubbleMenuProps) {
  const [linkUrl, setLinkUrl] = useState("https://");
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<ActiveBubbleMenu>(null);
  const [customColor, setCustomColor] = useState("#7c3aed");

  const editorState = useEditorState({
    editor,
    selector: () => ({
      isBold: editor.isActive("bold"),
      isItalic: editor.isActive("italic"),
      isUnderlined: editor.isActive("underline"),
      isStrike: editor.isActive("strike"),
      isCode: editor.isActive("code"),
      isLink: editor.isActive("link"),
      isParagraph: editor.isActive("paragraph"),
      isHeading1: editor.isActive("heading", { level: 1 }),
      isHeading2: editor.isActive("heading", { level: 2 }),
      isHeading3: editor.isActive("heading", { level: 3 }),
      isBulletList: editor.isActive("bulletList"),
      isOrderedList: editor.isActive("orderedList"),
      isTaskList: editor.isActive("taskList"),
      isBlockquote: editor.isActive("blockquote"),
      textColor: (editor.getAttributes("textStyle").color ?? null) as
        | string
        | null,
    }),
  });

  const currentBlockLabel = useMemo(() => {
    if (editorState.isHeading1) return "Heading 1";
    if (editorState.isHeading2) return "Heading 2";
    if (editorState.isHeading3) return "Heading 3";
    if (editorState.isBulletList) return "Bulleted List";
    if (editorState.isOrderedList) return "Numbered List";
    if (editorState.isTaskList) return "To-do List";
    if (editorState.isBlockquote) return "Blockquote";
    return "Text";
  }, [editorState]);

  function handleLinkClick() {
    if (editorState.isLink) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    setLinkUrl(
      (editor.getAttributes("link").href as string | undefined) ?? "https://",
    );
    setIsLinkDialogOpen(true);
  }

  function handleSubmitLink() {
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
  }

  function applyTextColor(color: string) {
    const selectionEnd = editor.state.selection.to;

    editor.chain().focus().setColor(color).setTextSelection(selectionEnd).run();
    setActiveMenu(null);
  }

  function applyHighlightColor(color: string) {
    const selectionEnd = editor.state.selection.to;

    editor
      .chain()
      .focus()
      .setHighlight({ color })
      .setTextSelection(selectionEnd)
      .run();
    setActiveMenu(null);
  }

  function applyTextAlign(alignment: "left" | "center" | "right" | "justify") {
    const selectionEnd = editor.state.selection.to;

    editor
      .chain()
      .focus()
      .setTextAlign(alignment)
      .setTextSelection(selectionEnd)
      .run();
    setActiveMenu(null);
  }

  function applyBlockTransform(command: () => void) {
    const selectionEnd = editor.state.selection.to;

    command();
    editor.chain().focus().setTextSelection(selectionEnd).run();
    setActiveMenu(null);
  }

  return (
    <>
      <TiptapBubbleMenu
        editor={editor}
        pluginKey={NOTION_BUBBLE_MENU_PLUGIN_KEY}
        updateDelay={100}
        shouldShow={({ editor: currentEditor, state }) => {
          const { selection } = state;
          return (
            currentEditor.isEditable &&
            selection instanceof TextSelection &&
            !selection.empty
          );
        }}
        options={{
          placement: "bottom-start",
          offset: 10,
          onHide: () => setActiveMenu(null),
        }}
        className="notion-selection-bubble"
      >
        <div className="notion-bubble-popover-wrap">
          <button
            type="button"
            className="notion-bubble-select"
            onClick={() =>
              setActiveMenu((menu) => (menu === "turn" ? null : "turn"))
            }
          >
            <span>{currentBlockLabel}</span>
            <ChevronDown className="size-3.5" />
          </button>

          {activeMenu === "turn" && (
            <div className="notion-bubble-turn-menu notion-bubble-local-menu">
              <div className="notion-bubble-menu-label">Turn Into</div>
              <TurnIntoItem
                icon={<Pilcrow className="size-4" />}
                active={editorState.isParagraph}
                label="Text"
                onClick={() => {
                  applyBlockTransform(() => {
                    editor.chain().focus().setParagraph().run();
                  });
                }}
              />
              <TurnIntoItem
                icon={<Heading1 className="size-4" />}
                active={editorState.isHeading1}
                label="Heading 1"
                onClick={() => {
                  applyBlockTransform(() => {
                    editor.chain().focus().toggleHeading({ level: 1 }).run();
                  });
                }}
              />
              <TurnIntoItem
                icon={<Heading2 className="size-4" />}
                active={editorState.isHeading2}
                label="Heading 2"
                onClick={() => {
                  applyBlockTransform(() => {
                    editor.chain().focus().toggleHeading({ level: 2 }).run();
                  });
                }}
              />
              <TurnIntoItem
                icon={<Heading3 className="size-4" />}
                active={editorState.isHeading3}
                label="Heading 3"
                onClick={() => {
                  applyBlockTransform(() => {
                    editor.chain().focus().toggleHeading({ level: 3 }).run();
                  });
                }}
              />
              <TurnIntoItem
                icon={<List className="size-4" />}
                active={editorState.isBulletList}
                label="Bulleted List"
                onClick={() => {
                  applyBlockTransform(() => {
                    editor.chain().focus().toggleBulletList().run();
                  });
                }}
              />
              <TurnIntoItem
                icon={<ListOrdered className="size-4" />}
                active={editorState.isOrderedList}
                label="Numbered List"
                onClick={() => {
                  applyBlockTransform(() => {
                    editor.chain().focus().toggleOrderedList().run();
                  });
                }}
              />
              <TurnIntoItem
                icon={<CheckSquare className="size-4" />}
                active={editorState.isTaskList}
                label="To-do List"
                onClick={() => {
                  applyBlockTransform(() => {
                    editor.chain().focus().toggleTaskList().run();
                  });
                }}
              />
              <TurnIntoItem
                icon={<Quote className="size-4" />}
                active={editorState.isBlockquote}
                label="Blockquote"
                onClick={() => {
                  applyBlockTransform(() => {
                    editor.chain().focus().toggleBlockquote().run();
                  });
                }}
              />
              <TurnIntoItem
                icon={<Code2 className="size-4" />}
                active={editor.isActive("codeBlock")}
                label="Code block"
                onClick={() => {
                  applyBlockTransform(() => {
                    editor.chain().focus().toggleCodeBlock().run();
                  });
                }}
              />
            </div>
          )}
        </div>

        <span className="notion-bubble-separator" />

        <BubbleIconButton
          label="Bold"
          active={editorState.isBold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </BubbleIconButton>
        <BubbleIconButton
          label="Italic"
          active={editorState.isItalic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </BubbleIconButton>
        <BubbleIconButton
          label="Underline"
          active={editorState.isUnderlined}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="size-4" />
        </BubbleIconButton>
        <BubbleIconButton
          label="Strike"
          active={editorState.isStrike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </BubbleIconButton>
        <BubbleIconButton
          label="Code"
          active={editorState.isCode}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code2 className="size-4" />
        </BubbleIconButton>

        <span className="notion-bubble-separator" />

        <BubbleIconButton
          label="Link"
          active={editorState.isLink}
          onClick={handleLinkClick}
        >
          <Link2 className="size-4" />
        </BubbleIconButton>

        <div className="notion-bubble-popover-wrap">
          <button
            type="button"
            className="notion-bubble-color-trigger"
            onClick={() =>
              setActiveMenu((menu) => (menu === "color" ? null : "color"))
            }
          >
            <span
              className="notion-bubble-color-preview"
              style={{ color: editorState.textColor ?? "#7c3aed" }}
            >
              A
            </span>
            <ChevronDown className="size-3" />
          </button>

          {activeMenu === "color" && (
            <div className="notion-bubble-color-menu notion-bubble-local-menu notion-bubble-local-menu-end">
              <div className="notion-bubble-menu-label">Recently Used</div>
              <button
                type="button"
                className="notion-bubble-color-recent"
                onClick={() => {
                  applyTextColor("#f59e0b");
                }}
              >
                A
              </button>

              <div className="notion-bubble-menu-label">Text Color</div>
              <ColorGrid
                colors={TEXT_COLORS}
                type="text"
                onSelect={(color) => {
                  applyTextColor(color);
                }}
              />

              <div className="notion-bubble-menu-label">Highlight Color</div>
            <ColorGrid
              colors={HIGHLIGHT_COLORS}
              type="highlight"
              onSelect={(color) => {
                applyHighlightColor(color);
              }}
            />

              <div className="notion-bubble-menu-label">Custom Color</div>
              <div className="notion-bubble-custom-color">
                <input
                  type="color"
                  value={customColor}
                  onChange={(event) => setCustomColor(event.target.value)}
                  aria-label="Pick custom color"
                />
                <Input
                  value={customColor}
                  onChange={(event) => setCustomColor(event.target.value)}
                  placeholder="#7c3aed"
                  className="h-8"
                />
              </div>
              <div className="notion-bubble-custom-color-actions">
                <button
                  type="button"
                  onClick={() => {
                    applyTextColor(customColor);
                  }}
                >
                  Text
                </button>
                <button
                  type="button"
                  onClick={() => {
                    applyHighlightColor(customColor);
                  }}
                >
                  Highlight
                </button>
              </div>
            </div>
          )}
        </div>

        <span className="notion-bubble-separator" />

        <div className="notion-bubble-popover-wrap">
          <button
            type="button"
            className="notion-bubble-more"
            onClick={() =>
              setActiveMenu((menu) => (menu === "more" ? null : "more"))
            }
          >
            <MoreVertical className="size-4" />
          </button>

          {activeMenu === "more" && (
            <div className="notion-bubble-more-menu notion-bubble-local-menu notion-bubble-local-menu-end">
              <MenuButton
                onClick={() => {
                  applyTextAlign("left");
                }}
              >
                <AlignLeft className="size-4" /> Align left
              </MenuButton>
              <MenuButton
                onClick={() => {
                  applyTextAlign("center");
                }}
              >
                <AlignCenter className="size-4" /> Align center
              </MenuButton>
              <MenuButton
                onClick={() => {
                  applyTextAlign("right");
                }}
              >
                <AlignRight className="size-4" /> Align right
              </MenuButton>
              <MenuButton
                onClick={() => {
                  applyTextAlign("justify");
                }}
              >
                <AlignJustify className="size-4" /> Justify
              </MenuButton>
            </div>
          )}
        </div>
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
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmitLink();
            }}
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

type BubbleIconButtonProps = {
  active?: boolean;
  children: React.ReactNode;
  label: string;
  onClick: () => void;
};

function BubbleIconButton({
  active = false,
  children,
  label,
  onClick,
}: BubbleIconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn("notion-bubble-icon-button", active && "is-active")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

type TurnIntoItemProps = {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

function TurnIntoItem({ active, icon, label, onClick }: TurnIntoItemProps) {
  return (
    <button
      type="button"
      className={cn("notion-bubble-turn-item text-sm", active && "is-active")}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

type MenuButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
};

function MenuButton({ children, onClick }: MenuButtonProps) {
  return (
    <button
      type="button"
      className="notion-bubble-menu-button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

type ColorGridProps = {
  colors: string[];
  type: "highlight" | "text";
  onSelect: (color: string) => void;
};

function ColorGrid({ colors, type, onSelect }: ColorGridProps) {
  return (
    <div className="notion-bubble-color-grid">
      {colors.map((color) => (
        <button
          key={`${type}-${color}`}
          type="button"
          className="notion-bubble-color-swatch"
          style={{
            backgroundColor: type === "highlight" ? color : "transparent",
            color: type === "text" ? color : "#6b7280",
            borderColor: color,
          }}
          onClick={() => onSelect(color)}
        >
          {type === "text" ? "A" : null}
        </button>
      ))}
    </div>
  );
}
