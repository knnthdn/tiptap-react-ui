import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
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
import {
  getExtensionGroupState,
  isExtensionDisabled,
  isExtensionHidden,
} from "./extension-state";
import type {
  EditorExtensionName,
  EditorExtensionStateMap,
} from "./types/editors";

type NotionBubbleMenuProps = {
  editor: Editor;
  extensionState?: EditorExtensionStateMap;
};

type ActiveBubbleMenu = "color" | "more" | "turn" | null;
type BubbleColorType = "highlight" | "text";
type RecentBubbleColor = {
  color: string;
  type: BubbleColorType;
};

export const NOTION_BUBBLE_MENU_PLUGIN_KEY = "notionBubbleMenu";
const RECENT_COLORS_STORAGE_KEY = "tiptap-react-ui-notion-recent-colors";
const MAX_RECENT_COLORS = 6;
const BUBBLE_KEYBOARD_ITEM_SELECTOR = "button:not(:disabled)";

const TEXT_COLORS = [
  "#ffffff",
  "#000000",
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

export default function NotionBubbleMenu({
  editor,
  extensionState,
}: NotionBubbleMenuProps) {
  const [linkUrl, setLinkUrl] = useState("https://");
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<ActiveBubbleMenu>(null);
  const [menuPlacement, setMenuPlacement] = useState<"top" | "bottom">(
    "bottom",
  );
  const [isBubbleMenuVisible, setIsBubbleMenuVisible] = useState(false);
  const [customColor, setCustomColor] = useState("#7c3aed");
  const [recentColors, setRecentColors] = useState<RecentBubbleColor[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const value = window.localStorage.getItem(RECENT_COLORS_STORAGE_KEY);
      if (!value) return [];

      const parsed = JSON.parse(value) as RecentBubbleColor[];
      return Array.isArray(parsed)
        ? parsed.filter(
            (item) =>
              (item.type === "text" || item.type === "highlight") &&
              typeof item.color === "string",
          )
        : [];
    } catch {
      return [];
    }
  });

  const bubbleMenuRef = useRef<HTMLDivElement | null>(null);

  const updateLocalMenuLayout = useCallback(() => {
    const bubbleMenu = bubbleMenuRef.current;
    if (!bubbleMenu || typeof window === "undefined") return;

    const rect = bubbleMenu.getBoundingClientRect();
    const viewportGutter = 12;
    const menuOffset = 8;
    const availableBelow = Math.max(
      0,
      window.innerHeight - rect.bottom - viewportGutter - menuOffset,
    );
    const availableAbove = Math.max(
      0,
      rect.top - viewportGutter - menuOffset,
    );
    const placement =
      availableBelow >= 280 || availableBelow >= availableAbove
        ? "bottom"
        : "top";
    setMenuPlacement(placement);
  }, []);

  const toggleLocalMenu = useCallback(
    (menu: Exclude<ActiveBubbleMenu, null>, disabled: boolean) => {
      if (disabled || activeMenu === menu) {
        setActiveMenu(null);
        return;
      }

      updateLocalMenuLayout();
      setActiveMenu(menu);
    },
    [activeMenu, updateLocalMenuLayout],
  );

  const getKeyboardItems = useCallback(() => {
    const root = bubbleMenuRef.current;
    if (!root) return [];

    return Array.from(
      root.querySelectorAll<HTMLButtonElement>(BUBBLE_KEYBOARD_ITEM_SELECTOR),
    ).filter((item) => item.offsetParent !== null);
  }, []);

  const focusKeyboardItem = useCallback(
    (index: number) => {
      const items = getKeyboardItems();
      if (items.length === 0) return;

      const nextIndex = (index + items.length) % items.length;
      items[nextIndex]?.focus();
    },
    [getKeyboardItems],
  );

  const hideBubbleMenu = useCallback(() => {
    const selectionEnd = editor.state.selection.to;

    setActiveMenu(null);
    editor.chain().focus().setTextSelection(selectionEnd).run();
  }, [editor]);

  const handleBubbleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      const isTypingTarget = target.closest("input, textarea, select");

      if (isTypingTarget && event.key !== "Escape") return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        hideBubbleMenu();
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        event.stopPropagation();
        setActiveMenu(null);
        editor.chain().focus().deleteSelection().run();
        return;
      }

      const keyDirection =
        event.key === "ArrowRight" || event.key === "ArrowDown"
          ? 1
          : event.key === "ArrowLeft" || event.key === "ArrowUp"
            ? -1
            : 0;

      if (keyDirection !== 0) {
        event.preventDefault();
        event.stopPropagation();

        const items = getKeyboardItems();
        if (items.length === 0) return;

        const currentIndex = items.findIndex(
          (item) => item === document.activeElement,
        );

        focusKeyboardItem(currentIndex === -1 ? 0 : currentIndex + keyDirection);
        return;
      }

      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        event.stopPropagation();

        const items = getKeyboardItems();
        focusKeyboardItem(event.key === "Home" ? 0 : items.length - 1);
      }
    },
    [editor, focusKeyboardItem, getKeyboardItems, hideBubbleMenu],
  );

  useEffect(() => {
    if (!activeMenu) return;

    window.addEventListener("resize", updateLocalMenuLayout);
    window.addEventListener("scroll", updateLocalMenuLayout, true);

    return () => {
      window.removeEventListener("resize", updateLocalMenuLayout);
      window.removeEventListener("scroll", updateLocalMenuLayout, true);
    };
  }, [activeMenu, updateLocalMenuLayout]);

  useEffect(() => {
    if (!isBubbleMenuVisible) return;

    function handleEditorArrowKey(event: globalThis.KeyboardEvent) {
      const keyDirection =
        event.key === "ArrowRight" || event.key === "ArrowDown"
          ? 1
          : event.key === "ArrowLeft" || event.key === "ArrowUp"
            ? -1
            : 0;

      if (
        keyDirection === 0 ||
        event.defaultPrevented ||
        event.shiftKey ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (!target || !editor.view.dom.contains(target)) return;

      const { selection } = editor.state;
      if (!(selection instanceof TextSelection) || selection.empty) return;

      event.preventDefault();
      event.stopPropagation();

      const items = getKeyboardItems();
      focusKeyboardItem(keyDirection === -1 ? items.length - 1 : 0);
    }

    window.addEventListener("keydown", handleEditorArrowKey, true);

    return () => {
      window.removeEventListener("keydown", handleEditorArrowKey, true);
    };
  }, [editor, focusKeyboardItem, getKeyboardItems, isBubbleMenuVisible]);
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

  const control = (extension: EditorExtensionName) => ({
    disabled: isExtensionDisabled(extensionState, extension),
    hidden: isExtensionHidden(extensionState, extension),
  });

  const turnGroup = getExtensionGroupState(extensionState, [
    "heading",
    "bulletList",
    "orderedList",
    "taskList",
    "blockquote",
    "codeBlock",
  ]);
  const inlineGroup = getExtensionGroupState(extensionState, [
    "bold",
    "italic",
    "underline",
    "strike",
    "inlineCode",
  ]);
  const colorGroup = getExtensionGroupState(extensionState, [
    "textColor",
    "highlight",
  ]);
  const alignGroup = getExtensionGroupState(extensionState, [
    "alignLeft",
    "alignCenter",
    "alignRight",
    "alignJustify",
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      RECENT_COLORS_STORAGE_KEY,
      JSON.stringify(recentColors),
    );
  }, [recentColors]);

  function rememberColor(type: BubbleColorType, color: string) {
    const normalizedColor = color.trim().toLowerCase();
    if (!normalizedColor) return;

    setRecentColors((colors) => [
      { type, color: normalizedColor },
      ...colors.filter(
        (item) => item.type !== type || item.color !== normalizedColor,
      ),
    ].slice(0, MAX_RECENT_COLORS));
  }

  function handleLinkClick() {
    if (editorState.isLink) {
      runInlineAction(() => {
        editor.chain().focus().unsetLink().run();
      });
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
      runInlineAction(() => {
        editor.chain().focus().unsetLink().run();
      });
      setIsLinkDialogOpen(false);
      return;
    }

    runInlineAction(() => {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: trimmedUrl })
        .run();
    });
    setIsLinkDialogOpen(false);
  }

  function applyTextColor(color: string) {
    const selectionEnd = editor.state.selection.to;

    editor.chain().focus().setColor(color).setTextSelection(selectionEnd).run();
    rememberColor("text", color);
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
    rememberColor("highlight", color);
    setActiveMenu(null);
  }

  function getColorSwatchStyle(item: RecentBubbleColor) {
    if (item.type === "highlight") {
      return {
        backgroundColor: item.color,
        borderColor: item.color,
      };
    }

    const isLightTextColor = isLightColor(item.color);

    return {
      backgroundColor: isLightTextColor ? item.color : "transparent",
      color: isLightTextColor ? "#111827" : item.color,
      borderColor: item.color,
    };
  }

  function runInlineAction(command: () => void) {
    const selectionEnd = editor.state.selection.to;

    command();
    editor.chain().focus().setTextSelection(selectionEnd).run();
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
        appendTo={() =>
          editor.view.dom.closest<HTMLElement>(".tr-editor") ??
          editor.view.dom.parentElement ??
          document.body
        }
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
          strategy: "fixed",
          offset: 10,
          flip: { padding: 8 },
          shift: { padding: 8 },

          onShow: () => setIsBubbleMenuVisible(true),
          onHide: () => {
            setIsBubbleMenuVisible(false);
            setActiveMenu(null);
          },
        }}
        className="tr-notion-selection-bubble"
      >
        <div
          ref={bubbleMenuRef}
          role="toolbar"
          aria-label="Text formatting"
          tabIndex={-1}
          className="tr-notion-selection-bubble-content"
          onKeyDown={handleBubbleKeyDown}
        >
        {!turnGroup.hidden && (
        <div className="notion-bubble-popover-wrap">
          <button
            type="button"
            className="notion-bubble-select"
            disabled={turnGroup.disabled}
            onClick={() => toggleLocalMenu("turn", turnGroup.disabled)}
          >
            <span>{currentBlockLabel}</span>
            <ChevronDown className="size-3.5" />
          </button>

          {activeMenu === "turn" && (
            <div
              className={cn(
                "notion-bubble-turn-menu notion-bubble-local-menu",
                menuPlacement === "top" && "notion-bubble-local-menu-top",
              )}
            >
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
                disabled={control("heading").disabled}
                hidden={control("heading").hidden}
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
                disabled={control("heading").disabled}
                hidden={control("heading").hidden}
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
                disabled={control("heading").disabled}
                hidden={control("heading").hidden}
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
                disabled={control("bulletList").disabled}
                hidden={control("bulletList").hidden}
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
                disabled={control("orderedList").disabled}
                hidden={control("orderedList").hidden}
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
                disabled={control("taskList").disabled}
                hidden={control("taskList").hidden}
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
                disabled={control("blockquote").disabled}
                hidden={control("blockquote").hidden}
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
                disabled={control("codeBlock").disabled}
                hidden={control("codeBlock").hidden}
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
        )}

        {!turnGroup.hidden && !inlineGroup.hidden && (
          <span className="notion-bubble-separator" />
        )}

        {!inlineGroup.hidden && (
        <>
        {!control("bold").hidden && (
        <BubbleIconButton
          label="Bold"
          active={editorState.isBold}
          disabled={control("bold").disabled}
          onClick={() => {
            runInlineAction(() => {
              editor.chain().focus().toggleBold().run();
            });
          }}
        >
          <Bold className="size-4" />
        </BubbleIconButton>
        )}
        {!control("italic").hidden && (
        <BubbleIconButton
          label="Italic"
          active={editorState.isItalic}
          disabled={control("italic").disabled}
          onClick={() => {
            runInlineAction(() => {
              editor.chain().focus().toggleItalic().run();
            });
          }}
        >
          <Italic className="size-4" />
        </BubbleIconButton>
        )}
        {!control("underline").hidden && (
        <BubbleIconButton
          label="Underline"
          active={editorState.isUnderlined}
          disabled={control("underline").disabled}
          onClick={() => {
            runInlineAction(() => {
              editor.chain().focus().toggleUnderline().run();
            });
          }}
        >
          <Underline className="size-4" />
        </BubbleIconButton>
        )}
        {!control("strike").hidden && (
        <BubbleIconButton
          label="Strike"
          active={editorState.isStrike}
          disabled={control("strike").disabled}
          onClick={() => {
            runInlineAction(() => {
              editor.chain().focus().toggleStrike().run();
            });
          }}
        >
          <Strikethrough className="size-4" />
        </BubbleIconButton>
        )}
        {!control("inlineCode").hidden && (
        <BubbleIconButton
          label="Code"
          active={editorState.isCode}
          disabled={control("inlineCode").disabled}
          onClick={() => {
            runInlineAction(() => {
              editor.chain().focus().toggleCode().run();
            });
          }}
        >
          <Code2 className="size-4" />
        </BubbleIconButton>
        )}
        </>
        )}

        {(!inlineGroup.hidden && (!control("link").hidden || !colorGroup.hidden)) && (
          <span className="notion-bubble-separator" />
        )}

        {!control("link").hidden && (
        <BubbleIconButton
          label="Link"
          active={editorState.isLink}
          disabled={control("link").disabled}
          onClick={handleLinkClick}
        >
          <Link2 className="size-4" />
        </BubbleIconButton>
        )}

        {!colorGroup.hidden && (
        <div className="notion-bubble-popover-wrap">
          <button
            type="button"
            className="notion-bubble-color-trigger"
            disabled={colorGroup.disabled}
            onClick={() => toggleLocalMenu("color", colorGroup.disabled)}
          >
            <span
              className="notion-bubble-color-preview"
              style={{ color: editorState.textColor ?? "var(--color-primary)" }}
            >
              A
            </span>
            <ChevronDown className="size-3" />
          </button>

          {activeMenu === "color" && (
            <div
              className={cn(
                "notion-bubble-color-menu notion-bubble-local-menu notion-bubble-local-menu-end",
                menuPlacement === "top" && "notion-bubble-local-menu-top",
              )}
            >
              <div className="notion-bubble-menu-label">Recently Used</div>
              {recentColors.length > 0 ? (
                <div className="notion-bubble-recent-colors">
                  {recentColors
                    .filter((item) =>
                      item.type === "text"
                        ? !control("textColor").hidden
                        : !control("highlight").hidden,
                    )
                    .map((item) => {
                      const disabled =
                        item.type === "text"
                          ? control("textColor").disabled
                          : control("highlight").disabled;

                      return (
                        <button
                          key={`${item.type}-${item.color}`}
                          type="button"
                          disabled={disabled}
                          className="notion-bubble-color-recent"
                          style={getColorSwatchStyle(item)}
                          onClick={() => {
                            if (disabled) return;

                            if (item.type === "text") {
                              applyTextColor(item.color);
                            } else {
                              applyHighlightColor(item.color);
                            }
                          }}
                        >
                          {item.type === "text" ? "A" : null}
                        </button>
                      );
                    })}
                </div>
              ) : (
                <div className="notion-bubble-recent-empty">No recent colors</div>
              )}

              {!control("textColor").hidden && (
                <>
                  <div className="notion-bubble-menu-label">Text Color</div>
                  <ColorGrid
                    colors={TEXT_COLORS}
                    disabled={control("textColor").disabled}
                    type="text"
                    onSelect={(color) => {
                      applyTextColor(color);
                    }}
                  />
                </>
              )}

              {!control("highlight").hidden && (
                <>
                  <div className="notion-bubble-menu-label">
                    Highlight Color
                  </div>
                  <ColorGrid
                    colors={HIGHLIGHT_COLORS}
                    disabled={control("highlight").disabled}
                    type="highlight"
                    onSelect={(color) => {
                      applyHighlightColor(color);
                    }}
                  />
                </>
              )}

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
                {!control("textColor").hidden && (
                <button
                  type="button"
                  disabled={control("textColor").disabled}
                  onClick={() => {
                    applyTextColor(customColor);
                  }}
                >
                  Text
                </button>
                )}
                {!control("highlight").hidden && (
                <button
                  type="button"
                  disabled={control("highlight").disabled}
                  onClick={() => {
                    applyHighlightColor(customColor);
                  }}
                >
                  Highlight
                </button>
                )}
              </div>
            </div>
          )}
        </div>
        )}

        {(!colorGroup.hidden || !control("link").hidden) && !alignGroup.hidden && (
          <span className="notion-bubble-separator" />
        )}

        {!alignGroup.hidden && (
        <div className="notion-bubble-popover-wrap">
          <button
            type="button"
            className="notion-bubble-more"
            disabled={alignGroup.disabled}
            onClick={() => toggleLocalMenu("more", alignGroup.disabled)}
          >
            <MoreVertical className="size-4" />
          </button>

          {activeMenu === "more" && (
            <div
              className={cn(
                "notion-bubble-more-menu notion-bubble-local-menu notion-bubble-local-menu-end",
                menuPlacement === "top" && "notion-bubble-local-menu-top",
              )}
            >
              <MenuButton
                disabled={control("alignLeft").disabled}
                hidden={control("alignLeft").hidden}
                onClick={() => {
                  applyTextAlign("left");
                }}
              >
                <AlignLeft className="size-4" /> Align left
              </MenuButton>
              <MenuButton
                disabled={control("alignCenter").disabled}
                hidden={control("alignCenter").hidden}
                onClick={() => {
                  applyTextAlign("center");
                }}
              >
                <AlignCenter className="size-4" /> Align center
              </MenuButton>
              <MenuButton
                disabled={control("alignRight").disabled}
                hidden={control("alignRight").hidden}
                onClick={() => {
                  applyTextAlign("right");
                }}
              >
                <AlignRight className="size-4" /> Align right
              </MenuButton>
              <MenuButton
                disabled={control("alignJustify").disabled}
                hidden={control("alignJustify").hidden}
                onClick={() => {
                  applyTextAlign("justify");
                }}
              >
                <AlignJustify className="size-4" /> Justify
              </MenuButton>
            </div>
          )}
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
  disabled?: boolean;
  label: string;
  onClick: () => void;
};

function BubbleIconButton({
  active = false,
  children,
  disabled = false,
  label,
  onClick,
}: BubbleIconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      className={cn("notion-bubble-icon-button", active && "is-active")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

type TurnIntoItemProps = {
  active: boolean;
  disabled?: boolean;
  hidden?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

function TurnIntoItem({
  active,
  disabled = false,
  hidden = false,
  icon,
  label,
  onClick,
}: TurnIntoItemProps) {
  if (hidden) return null;

  return (
    <button
      type="button"
      disabled={disabled}
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
  disabled?: boolean;
  hidden?: boolean;
  onClick: () => void;
};

function MenuButton({
  children,
  disabled = false,
  hidden = false,
  onClick,
}: MenuButtonProps) {
  if (hidden) return null;

  return (
    <button
      type="button"
      disabled={disabled}
      className="notion-bubble-menu-button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

type ColorGridProps = {
  colors: string[];
  disabled?: boolean;
  type: "highlight" | "text";
  onSelect: (color: string) => void;
};

function isLightColor(color: string) {
  const normalizedColor = color.trim().toLowerCase();

  if (normalizedColor === "white" || normalizedColor === "#fff") return true;
  if (/^#ffffff(?:ff)?$/.test(normalizedColor)) return true;
  if (!/^#[\da-f]{6}$/i.test(normalizedColor)) return false;

  const red = Number.parseInt(normalizedColor.slice(1, 3), 16);
  const green = Number.parseInt(normalizedColor.slice(3, 5), 16);
  const blue = Number.parseInt(normalizedColor.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

  return luminance > 0.88;
}

function ColorGrid({
  colors,
  disabled = false,
  type,
  onSelect,
}: ColorGridProps) {
  return (
    <div className="notion-bubble-color-grid">
      {colors.map((color) => {
        const isLightTextColor = type === "text" && isLightColor(color);

        return (
          <button
            key={`${type}-${color}`}
            type="button"
            disabled={disabled}
            className="notion-bubble-color-swatch"
            style={{
              backgroundColor:
                type === "highlight" || isLightTextColor
                  ? color
                  : "transparent",
              color:
                type === "text"
                  ? isLightTextColor
                    ? "#111827"
                    : color
                  : "#6b7280",
              borderColor: color,
            }}
            onClick={() => onSelect(color)}
          >
            {type === "text" ? "A" : null}
          </button>
        );
      })}
    </div>
  );
}
