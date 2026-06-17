import { ButtonHTMLAttributes, useEffect, useMemo, useState } from "react";
import { Editor, useEditorState } from "@tiptap/react";
import { Button } from "../ui/button";
import type { Level as HeadingsLevel } from "@tiptap/extension-heading";

import {
  Bold,
  ChevronDown,
  Code,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  LucideIcon,
  MessageSquareQuote,
  Minus,
  Redo2,
  Strikethrough,
  Table2,
  Terminal,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignJustify,
  TextAlignStart,
  TextWrap,
  Underline,
  Undo2,
  Video,
  CaseSensitive,
  Save,
} from "lucide-react";
import { isValidYoutubeUrl } from "@tiptap/extension-youtube";
import { cn } from "../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import chroma from "chroma-js";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { ImageUploadButton } from "../tiptap-ui/image-upload-button";
import { useMenubarUiState } from "./hooks/useMenubarUiState";
import {
  getExtensionGroupState,
  isExtensionDisabled,
  isExtensionHidden,
} from "./extension-state";
import type {
  EditorExtensionName,
  EditorExtensionStateMap,
} from "./types/editors";

const TEXT_COLOR_PRESETS = [
  "#111827",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
  "#ffffff",
] as const;

const HIGHLIGHT_PRESETS = [
  "#ffcc00",
  "#f59e0b",
  "#fb7185",
  "#f97316",
  "#a3e635",
  "#34d399",
  "#38bdf8",
  "#818cf8",
  "#c084fc",
  "#f9a8d4",
] as const;

const TABLE_PICKER_ROWS = 10;
const TABLE_PICKER_COLS = 10;

const FONT_SIZE_OPTIONS = [
  { key: "default", label: "16px", value: null },
  { key: "12", label: "12px", value: "12px" },
  { key: "14", label: "14px", value: "14px" },
  { key: "16", label: "16px", value: "16px" },
  { key: "18", label: "18px", value: "18px" },
  { key: "20", label: "20px", value: "20px" },
  { key: "24", label: "24px", value: "24px" },
  { key: "30", label: "30px", value: "30px" },
  { key: "36", label: "36px", value: "36px" },
  { key: "48", label: "48px", value: "48px" },
  { key: "72", label: "72px", value: "72px" },
] as const;

const FONT_FAMILY_OPTIONS = [
  { key: "default", label: "Calibri", value: null },
  { key: "calibri", label: "Calibri", value: "Calibri" },
  { key: "inter", label: "Inter", value: "Inter" },
  { key: "arial", label: "Arial", value: "Arial" },
  { key: "arial-black", label: "Arial Black", value: "Arial Black" },
  { key: "bahnschrift", label: "Bahnschrift", value: "Bahnschrift" },
  { key: "cursive", label: "Cursive", value: "Cursive" },
  { key: "comicSansMs", label: "Comic Sans", value: "Comic Sans MS" },
  { key: "monospace", label: "Monospace", value: "monospace" },

  {
    key: "century-gothic",
    label: "Century Gothic",
    value: "Century Gothic",
  },
  {
    key: "franklin-gothic-medium",
    label: "Franklin Gothic Medium",
    value: "Franklin Gothic Medium",
  },
  { key: "segoe-ui", label: "Segoe UI", value: "Segoe UI" },
  { key: "tahoma", label: "Tahoma", value: "Tahoma" },
  { key: "verdana", label: "Verdana", value: "Verdana" },
] as const;

// type TextBlockKey = (typeof TEXT_BLOCK_OPTIONS)[number]["key"];

function isReadable(fg: string, bg: string) {
  const ratio = chroma.contrast(fg, bg);
  return ratio >= 4.5;
}

function getReadableTextColor(background: string) {
  return isReadable("#ffffff", background) ? "#ffffff" : "#111827";
}

type MenubarProps = {
  editor: Editor;
  extensionState?: EditorExtensionStateMap;
  highlightColor: string;
  onHighlightColorChange: (color: string) => void;
  handleUserSaveAction: () => void;
  hasOnSave: boolean;
};

export default function Menubar({
  editor,
  extensionState,
  highlightColor,
  handleUserSaveAction,
  hasOnSave,
  onHighlightColorChange,
}: MenubarProps) {
  const { uiState, actions } = useMenubarUiState(highlightColor);
  const [hoveredTableSize, setHoveredTableSize] = useState<{
    rows: number;
    cols: number;
  } | null>(null);
  const {
    isLinkDialogOpen,
    linkUrl,
    isImageDialogOpen,
    imageUrl,
    imageAlt,
    imageTitle,
    imageInline,
    isInsertTableDialogOpen,
    tableRows,
    tableCols,
    tableWithHeaderRow,
    customHighlightColor,
    isHighlightMenuOpen,
    isFontSizeMenuOpen,
    isFontFamilyMenuOpen,
    isYoutubeDialogOpen,
    youtubeUrl,
    youtubeWidth,
    youtubeHeight,
    youtubeFullWidth,
    isTextColorMenuOpen,
    customTextColor,
    customTextColorInput,
    isAlignMenuOpen,
    isTextBlockMenuOpen,
  } = uiState;
  const {
    openYoutubeDialog: setYoutubeDialogState,
    resetTableDialog,
    setIsLinkDialogOpen,
    setLinkUrl,
    setIsImageDialogOpen,
    setImageUrl,
    setImageAlt,
    setImageTitle,
    setImageInline,
    setIsInsertTableDialogOpen,
    setTableRows,
    setTableCols,
    setTableWithHeaderRow,
    setCustomHighlightColor,
    setIsHighlightMenuOpen,
    setIsFontSizeMenuOpen,
    setIsFontFamilyMenuOpen,
    setIsYoutubeDialogOpen,
    setYoutubeUrl,
    setYoutubeWidth,
    setYoutubeHeight,
    setYoutubeFullWidth,
    setIsTextColorMenuOpen,
    setCustomTextColor,
    setCustomTextColorInput,
    setIsAlignMenuOpen,
    setIsTextBlockMenuOpen,
  } = actions;

  //* EDITOR STATE
  const editorState = useEditorState({
    editor,
    selector: () => {
      return {
        //* MARKS
        isBold: editor.isActive("bold"),
        isItalic: editor.isActive("italic"),
        isUnderlined: editor.isActive("underline"),
        isStrike: editor.isActive("strike"),
        isCode: editor.isActive("code"),
        isLink: editor.isActive("link"),
        isHighlight: editor.isActive("highlight"),
        highlightColor: (editor.getAttributes("highlight").color ?? null) as
          | string
          | null,
        fontSize: (editor.getAttributes("textStyle").fontSize ?? null) as
          | string
          | null,
        fontFamily: (editor.getAttributes("textStyle").fontFamily ?? null) as
          | string
          | null,
        textColor: (editor.getAttributes("textStyle").color ?? null) as
          | string
          | null,
        canUndo: editor.can().chain().undo().run(),
        canRedo: editor.can().chain().redo().run(),

        //* BLOCK TYPES
        isParagraph: editor.isActive("paragraph"),
        isHeading1: editor.isActive("heading", { level: 1 }),
        isHeading2: editor.isActive("heading", { level: 2 }),
        isHeading3: editor.isActive("heading", { level: 3 }),
        isHeading4: editor.isActive("heading", { level: 4 }),
        isHeading5: editor.isActive("heading", { level: 5 }),
        isHeading6: editor.isActive("heading", { level: 6 }),
        isQuote: editor.isActive("blockquote"),
        isCodeBlock: editor.isActive("codeBlock"),

        //* Lists and blocks
        isOrderedList: editor.isActive("orderedList"),
        isBulletList: editor.isActive("bulletList"),
        isTaskItem: editor.isActive("taskItem"),
        isTable: editor.isActive("table"),

        //* TEXTALIGN
        isAlignLeft: editor.isActive({ textAlign: "left" }),
        isAlignRight: editor.isActive({ textAlign: "right" }),
        isAlignCenter: editor.isActive({ textAlign: "center" }),
        isAlignJustify: editor.isActive({ textAlign: "justify" }),

        isImage: editor.isActive("image") || editor.isActive("inlineImage") || editor.isActive("imagePlus"),
        isYoutube: editor.isActive("youtube"),
      };
    },
  });

  const textBlocks = useMemo(
    () => [
      {
        label: "Heading 1",
        level: 1,
        state: editorState.isHeading1,
      },
      {
        label: "Heading 2",
        level: 2,
        state: editorState.isHeading2,
      },
      {
        label: "Heading 3",
        level: 3,
        state: editorState.isHeading3,
      },
      {
        label: "Heading 4",
        level: 4,
        state: editorState.isHeading4,
      },
      {
        label: "Heading 5",
        level: 5,
        state: editorState.isHeading5,
      },
      {
        label: "Heading 6",
        level: 6,
        state: editorState.isHeading6,
      },
    ],
    [
      editorState.isHeading1,
      editorState.isHeading2,
      editorState.isHeading3,
      editorState.isHeading4,
      editorState.isHeading5,
      editorState.isHeading6,
    ],
  );

  //* HANDLE LINK FUNCTIONS
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

  const handleImageClick = () => {
    const isInlineImage = editor.isActive("inlineImage");
    const imageAttributes = editor.getAttributes(
      isInlineImage ? "inlineImage" : "image",
    ) as {
      src?: string;
      alt?: string;
      title?: string;
      inline?: boolean;
    };

    setImageUrl(imageAttributes.src ?? "https://");
    setImageAlt(imageAttributes.alt ?? "");
    setImageTitle(imageAttributes.title ?? "");
    setImageInline(isInlineImage || Boolean(imageAttributes.inline));
    setIsImageDialogOpen(true);
  };
  const handleSubmitImage = () => {
    const trimmedUrl = imageUrl.trim();

    if (!trimmedUrl) {
      return;
    }

    const trimmedAlt = imageAlt.trim();
    const trimmedTitle = imageTitle.trim();
    const attrs = {
      src: trimmedUrl,
      alt: trimmedAlt || undefined,
      title: trimmedTitle || undefined,
      alignment: imageInline ? "left" : "center",
    };

    if (editor.isActive("image")) {
      editor.chain().focus().updateAttributes("image", { ...attrs, inline: imageInline }).run();
    } else {
      editor.chain().focus().setImage({ ...attrs, inline: imageInline } as {
        src: string;
        alt?: string;
        title?: string;
        alignment: string;
        inline?: boolean;
      }).run();
    }

    setIsImageDialogOpen(false);
  };

  const clampTableDimension = (value: number) => {
    if (!Number.isFinite(value)) return 1;
    return Math.min(50, Math.max(1, Math.trunc(value)));
  };

  const selectedTableRows = hoveredTableSize?.rows ?? tableRows;
  const selectedTableCols = hoveredTableSize?.cols ?? tableCols;

  const handleInsertTable = (
    rowsValue = selectedTableRows,
    colsValue = selectedTableCols,
  ) => {
    const rows = clampTableDimension(rowsValue);
    const cols = clampTableDimension(colsValue);

    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: tableWithHeaderRow })
      .run();

    setTableRows(rows);
    setTableCols(cols);
    setHoveredTableSize(null);
    setIsInsertTableDialogOpen(false);
  };

  const clampDimension = (value: number, fallback: number) => {
    if (!Number.isFinite(value) || value < 1) return fallback;
    return Math.min(7680, Math.trunc(value));
  };

  const toDimension = (value: unknown, fallback: number) => {
    if (typeof value === "number") {
      return clampDimension(value, fallback);
    }
    if (typeof value === "string") {
      const parsed = Number(value.replace("px", "").trim());
      return clampDimension(parsed, fallback);
    }
    return fallback;
  };

  const openYoutubeDialog = () => {
    if (editorState.isYoutube) {
      const youtubeAttributes = editor.getAttributes("youtube") as {
        src?: string;
        width?: number | string;
        height?: number | string;
      };
      const isFullWidth = String(youtubeAttributes.width) === "100%";

      setYoutubeDialogState({
        url: youtubeAttributes.src ?? "",
        width: toDimension(youtubeAttributes.width, 640),
        height: toDimension(youtubeAttributes.height, 480),
        fullWidth: isFullWidth,
      });
    } else {
      setYoutubeDialogState({
        url: "",
        width: 640,
        height: 480,
        fullWidth: false,
      });
    }
  };

  const handleSubmitYoutube = () => {
    const trimmed = youtubeUrl.trim();
    if (!trimmed || !isValidYoutubeUrl(trimmed)) {
      return;
    }

    if (editorState.isYoutube) {
      if (youtubeFullWidth) {
        editor
          .chain()
          .focus()
          .updateAttributes("youtube", {
            src: trimmed,
            // iframe accepts %; types only list number
            width: "100%" as unknown as number,
            height: "100%" as unknown as number,
          })
          .run();
      } else {
        const w = clampDimension(youtubeWidth, 640);
        const h = clampDimension(youtubeHeight, 480);

        editor
          .chain()
          .focus()
          .updateAttributes("youtube", {
            src: trimmed,
            width: w,
            height: h,
          })
          .run();
      }
    } else {
      if (youtubeFullWidth) {
        editor
          .chain()
          .focus()
          .setYoutubeVideo({
            src: trimmed,
            // iframe accepts %; types only list number
            width: "100%" as unknown as number,
            height: "100%" as unknown as number,
          })
          .run();
      } else {
        const w = clampDimension(youtubeWidth, 640);
        const h = clampDimension(youtubeHeight, 480);

        editor
          .chain()
          .focus()
          .setYoutubeVideo({
            src: trimmed,
            width: w,
            height: h,
          })
          .run();
      }
    }

    setIsYoutubeDialogOpen(false);
  };

  useEffect(() => {
    if (!isInsertTableDialogOpen) {
      setHoveredTableSize(null);
    }
  }, [isInsertTableDialogOpen]);

  //* HANDLE HIGHLIGHT FUNCTIONS
  const setHighlightColorValue = (color: string) => {
    const normalizedColor = color.trim();

    if (!chroma.valid(normalizedColor)) {
      return;
    }

    onHighlightColorChange(normalizedColor);
    setCustomHighlightColor(normalizedColor);

    if (!editor.state.selection.empty) {
      const textColor = getReadableTextColor(normalizedColor);

      editor
        .chain()
        .focus()
        .setColor(textColor)
        .setHighlight({ color: normalizedColor })
        .run();
    }

    setIsHighlightMenuOpen(false);
  };

  const applyHighlightColor = (color: string) => {
    const normalizedColor = color.trim();

    if (!chroma.valid(normalizedColor)) {
      return;
    }

    const textColor = getReadableTextColor(normalizedColor);

    onHighlightColorChange(normalizedColor);
    setCustomHighlightColor(normalizedColor);

    if (editorState.isHighlight) {
      editor.chain().focus().unsetHighlight().unsetColor().run();
      return;
    }

    editor
      .chain()
      .focus()
      .setColor(textColor)
      .setHighlight({ color: normalizedColor })
      .run();
  };

  //* LINK USE-EFFECT
  useEffect(() => {
    function checkDialogState() {
      const previousUrl = editor.getAttributes("link").href as
        | string
        | undefined;
      setLinkUrl(previousUrl ?? "https://");
    }

    if (!isLinkDialogOpen) {
      return;
    }

    checkDialogState();
  }, [editor, isLinkDialogOpen]);

  //* HIGHLIGHT USE-EFFECT
  useEffect(() => {
    (() => {
      const activeHighlightColor = editorState.highlightColor;

      if (!activeHighlightColor || !chroma.valid(activeHighlightColor)) {
        return;
      }

      onHighlightColorChange(activeHighlightColor);
      setCustomHighlightColor(activeHighlightColor);
    })();
  }, [editorState.highlightColor, onHighlightColorChange]);

  useEffect(() => {
    (() => {
      setCustomHighlightColor(highlightColor);
    })();
  }, [highlightColor]);

  const currentHighlightColor =
    editorState.highlightColor && chroma.valid(editorState.highlightColor)
      ? editorState.highlightColor
      : highlightColor;

  // //* HANDLE TEXTBLOCK
  const activeFontSize = useMemo(
    () =>
      FONT_SIZE_OPTIONS.find(
        (option) => option.value === editorState.fontSize,
      ) ?? FONT_SIZE_OPTIONS[0],
    [editorState.fontSize],
  );

  const activeFontFamily = useMemo(
    () =>
      FONT_FAMILY_OPTIONS.find(
        (option) => option.value === editorState.fontFamily,
      ) ?? FONT_FAMILY_OPTIONS[0],
    [editorState.fontFamily],
  );

  //* Applies the selected font size to the current selection, or clears it when "Default" is chosen.
  const applyFontSize = (fontSize: string | null) => {
    const chain = editor.chain().focus();

    if (fontSize) {
      chain.setFontSize(fontSize).run();
    } else {
      chain.unsetFontSize().run();
    }

    setIsFontSizeMenuOpen(false);
  };

  //* Applies the selected font family to the current selection, or clears it when the default family is chosen.
  const applyFontFamily = (fontFamily: string | null) => {
    const chain = editor.chain().focus();

    if (fontFamily) {
      chain.setFontFamily(fontFamily).run();
    } else {
      chain.unsetFontFamily().run();
    }

    setIsFontFamilyMenuOpen(false);
  };

  //* TEXT COLOR FUNCTIONS
  const currentTextColor =
    editorState.textColor && chroma.valid(editorState.textColor)
      ? editorState.textColor
      : customTextColor;

  const applyTextColor = (color: string) => {
    const normalizedColor = color.trim();

    if (!chroma.valid(normalizedColor)) {
      return;
    }

    setCustomTextColor(normalizedColor);
    setCustomTextColorInput(normalizedColor);
    editor.chain().focus().setColor(normalizedColor).run();
    setIsTextColorMenuOpen(false);
  };

  const removeTextColor = () => {
    editor.chain().focus().unsetColor().run();
    setCustomTextColor("#111827");
    setCustomTextColorInput("#111827");
    setIsTextColorMenuOpen(false);
  };

  const toggleTextColor = () => {
    if (editorState.textColor) {
      editor.chain().focus().unsetColor().run();
      setCustomTextColor("#111827");
      setCustomTextColorInput("#111827");
    } else {
      const normalizedColor = currentTextColor.trim();
      if (chroma.valid(normalizedColor)) {
        setCustomTextColor(normalizedColor);
        setCustomTextColorInput(normalizedColor);
        editor.chain().focus().setColor(normalizedColor).run();
      }
    }
  };

  const ActiveAlignIcon = editorState.isAlignLeft
    ? TextAlignStart
    : editorState.isAlignCenter
      ? TextAlignCenter
      : editorState.isAlignRight
        ? TextAlignEnd
        : editorState.isAlignJustify
          ? TextAlignJustify
          : TextAlignStart;

  const isAnyAlignActive =
    editorState.isAlignLeft ||
    editorState.isAlignCenter ||
    editorState.isAlignRight ||
    editorState.isAlignJustify;

  const control = (extension: EditorExtensionName) => ({
    disabled: isExtensionDisabled(extensionState, extension),
    hidden: isExtensionHidden(extensionState, extension),
  });

  const group = (extensions: EditorExtensionName[]) =>
    getExtensionGroupState(extensionState, extensions);

  const groupClassName = (extensions: EditorExtensionName[]) =>
    cn(
      "flex shrink-0 items-center gap-1",
      group(extensions).disabled && "opacity-60",
    );

  const historyGroup = group(["undo", "redo"]);
  const typographyGroup = group(["heading", "fontFamily", "fontSize"]);
  const inlineGroup = group(["bold", "italic", "underline", "strike"]);
  const colorGroup = group(["textColor", "highlight"]);
  const linkCodeGroup = group(["link", "inlineCode"]);
  const alignGroup = group([
    "alignLeft",
    "alignCenter",
    "alignRight",
    "alignJustify",
  ]);
  const listGroup = group(["bulletList", "orderedList", "taskList"]);
  const blockGroup = group([
    "blockquote",
    "codeBlock",
    "horizontalRule",
    "hardBreak",
  ]);
  const insertGroup = group(["table", "image", "imageUpload", "youtube"]);

  return (
    <>
      <div className="flex w-full flex-wrap gap-1.5 border-b bg-muted p-1.5 sm:gap-2.5 sm:p-2">
        {/* ── GROUP 1: HISTORY ── */}
        {!historyGroup.hidden && (
          <div className={groupClassName(["undo", "redo"])}>
            {!control("undo").hidden && (
              <MenuBottons
                onClick={() => editor.chain().focus().undo().run()}
                state={false}
                Icon={Undo2}
                title="Undo (CTRL + Z)"
                disabled={!editorState.canUndo || control("undo").disabled}
              />
            )}
            {!control("redo").hidden && (
              <MenuBottons
                onClick={() => editor.chain().focus().redo().run()}
                state={false}
                Icon={Redo2}
                title="Redo (CTRL + Y)"
                disabled={!editorState.canRedo || control("redo").disabled}
              />
            )}
            <Separator orientation="vertical" />
          </div>
        )}

        {/* ── GROUP 3: TYPOGRAPHY (Font Family + Font Size + Headings) ── */}
        {!typographyGroup.hidden && (
          <div
            className={groupClassName(["heading", "fontFamily", "fontSize"])}
          >
            {!control("heading").hidden && (
              <DropdownMenu
                open={isTextBlockMenuOpen}
                onOpenChange={(open) =>
                  setIsTextBlockMenuOpen(
                    control("heading").disabled ? false : open,
                  )
                }
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={control("heading").disabled}
                    className="h-7 w-12 cursor-pointer justify-between px-2 text-foreground sm:h-8"
                  >
                    {editorState.isHeading1 && <HeadingsIcon label="1" />}

                    {editorState.isHeading2 && <HeadingsIcon label="2" />}

                    {editorState.isHeading3 && <HeadingsIcon label="3" />}

                    {editorState.isHeading4 && <HeadingsIcon label="4" />}

                    {editorState.isHeading5 && <HeadingsIcon label="5" />}

                    {editorState.isHeading6 && <HeadingsIcon label="6" />}

                    {!editor.isActive("heading") && (
                      <span className="inline-flex w-4">H</span>
                    )}
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="max-h-60 px-0 py-0 overflow-hidden">
                  {textBlocks.map((options, i) => {
                    return (
                      <TextBlockButton
                        key={i}
                        label={options.label}
                        onClick={() => {
                          editor
                            .chain()
                            .toggleHeading({
                              level: options.level as HeadingsLevel,
                            })
                            .run();

                          setIsTextBlockMenuOpen(false);
                        }}
                        state={options.state}
                        title={options.label}
                      />
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {!control("fontFamily").hidden && (
              <DropdownMenu
                open={isFontFamilyMenuOpen}
                onOpenChange={(open) =>
                  setIsFontFamilyMenuOpen(
                    control("fontFamily").disabled ? false : open,
                  )
                }
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={control("fontFamily").disabled}
                    className="h-7 w-24 cursor-pointer justify-between px-2 text-foreground sm:h-8 sm:w-28"
                  >
                    <span className="min-w-0 flex-1 truncate text-left">
                      {activeFontFamily.label}
                    </span>
                    <ChevronDown className="shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-50 max-h-80 px-0 py-0 overflow-auto">
                  {FONT_FAMILY_OPTIONS.map((option) => (
                    <TextBlockButton
                      key={option.key}
                      label={option.label}
                      onClick={() => applyFontFamily(option.value)}
                      state={activeFontFamily.key === option.key}
                      title={`Font Family ${option.label}`}
                    />
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {!control("fontSize").hidden && (
              <DropdownMenu
                open={isFontSizeMenuOpen}
                onOpenChange={(open) =>
                  setIsFontSizeMenuOpen(
                    control("fontSize").disabled ? false : open,
                  )
                }
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={control("fontSize").disabled}
                    className="h-7 min-w-16 cursor-pointer px-2 text-foreground sm:h-8 sm:min-w-20"
                  >
                    {activeFontSize.label}
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-60 px-0 py-0 w-5">
                  {FONT_SIZE_OPTIONS.map((option) => (
                    <TextBlockButton
                      key={option.key}
                      label={option.label}
                      onClick={() => applyFontSize(option.value)}
                      state={activeFontSize.key === option.key}
                      title={`Font Size ${option.label}`}
                    />
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Separator orientation="vertical" className="ml-1" />
          </div>
        )}

        {/* ── GROUP 4: INLINE FORMATTING (Bold, Italic, Underline, Strikethrough) ── */}
        {!inlineGroup.hidden && (
          <div
            className={groupClassName([
              "bold",
              "italic",
              "underline",
              "strike",
            ])}
          >
            {!control("bold").hidden && (
              <MenuBottons
                onClick={() => editor.chain().focus().toggleBold().run()}
                state={editorState.isBold}
                Icon={Bold}
                title="Bold (CTRL + B)"
                disabled={control("bold").disabled}
              />
            )}
            {!control("italic").hidden && (
              <MenuBottons
                onClick={() => editor.chain().focus().toggleItalic().run()}
                state={editorState.isItalic}
                Icon={Italic}
                title="Italic (CTRL + I)"
                disabled={control("italic").disabled}
              />
            )}
            {!control("underline").hidden && (
              <MenuBottons
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                state={editorState.isUnderlined}
                Icon={Underline}
                title="Underline (CTRL + U)"
                disabled={control("underline").disabled}
              />
            )}
            {!control("strike").hidden && (
              <MenuBottons
                onClick={() => editor.chain().focus().toggleStrike().run()}
                state={editorState.isStrike}
                Icon={Strikethrough}
                title="StrikeThrough (CTRL + SHFT + S)"
                disabled={control("strike").disabled}
              />
            )}
            <Separator orientation="vertical" />
          </div>
        )}

        {/* ── GROUP 5: TEXT COLOR & HIGHLIGHT ── */}
        {!colorGroup.hidden && (
          <div className={groupClassName(["textColor", "highlight"])}>
            {/* TEXT COLOR */}
            {!control("textColor").hidden && (
              <div
                className={cn(
                  "inline-flex items-center rounded-md border",
                  editorState.textColor && "border-border",
                )}
              >
                <Button
                  title="Apply text color"
                  size="icon"
                  onClick={toggleTextColor}
                  disabled={control("textColor").disabled}
                  className={cn(
                    "relative size-7 cursor-pointer rounded-r-none border-0 bg-transparent px-2 sm:size-8",
                    editorState.textColor &&
                      "bg-foreground shadow-xs hover:bg-foreground dark:hover:bg-foreground",
                  )}
                  data-active={!!editorState.textColor}
                >
                  <CaseSensitive
                    className={cn(
                      "size-4",
                      editorState.textColor
                        ? "text-primary-foreground"
                        : "text-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "absolute right-1.5 bottom-0.5 left-1.5 h-0.5 rounded-full",
                      editorState.textColor && "h-1",
                    )}
                    style={{ backgroundColor: currentTextColor }}
                  />
                </Button>
                <DropdownMenu
                  open={isTextColorMenuOpen}
                  onOpenChange={(open) =>
                    setIsTextColorMenuOpen(
                      control("textColor").disabled ? false : open,
                    )
                  }
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      title="Choose text color"
                      size="icon"
                      variant="ghost"
                      disabled={control("textColor").disabled}
                      className="size-7 cursor-pointer rounded-l-none border-0 border-l border-border/50 bg-transparent px-1.5 sm:size-8"
                    >
                      <ChevronDown className="size-3.5 text-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={8}
                    className="w-56"
                  >
                    <DropdownMenuLabel>Text color</DropdownMenuLabel>
                    <div className="grid grid-cols-5 gap-2 px-1 py-2">
                      {TEXT_COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          title={color}
                          aria-label={color}
                          onClick={() => applyTextColor(color)}
                          className={cn(
                            "size-8 cursor-pointer rounded-md border border-border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            currentTextColor.toLowerCase() ===
                              color.toLowerCase() && "ring-2 ring-ring",
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <DropdownMenuSeparator />
                    <div className="px-1 py-1 space-y-1">
                      <input
                        type="text"
                        value={customTextColorInput}
                        onChange={(event) =>
                          setCustomTextColorInput(event.target.value)
                        }
                        onKeyDown={(event) => {
                          event.stopPropagation();
                          if (event.key === "Enter") {
                            event.preventDefault();
                            applyTextColor(customTextColorInput);
                          }
                        }}
                        placeholder="#111827"
                        className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      />
                      <button
                        type="button"
                        onClick={removeTextColor}
                        className="flex h-8 w-full items-center justify-center rounded-md border border-input bg-transparent px-2 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                      >
                        Remove color
                      </button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* HIGHLIGHT */}
            {!control("highlight").hidden && (
              <div
                className={cn(
                  "inline-flex items-center rounded-md border",
                  editorState.isHighlight && "border-border",
                )}
              >
                <Button
                  title="Highlight (CTRL + SHFT + H)"
                  size="icon"
                  onClick={() => applyHighlightColor(currentHighlightColor)}
                  disabled={control("highlight").disabled}
                  className={cn(
                    "relative size-7 cursor-pointer rounded-r-none border-0 bg-transparent px-2 sm:size-8",
                    editorState.isHighlight &&
                      "bg-foreground shadow-xs hover:bg-foreground dark:hover:bg-foreground",
                  )}
                  data-active={editorState.isHighlight}
                >
                  <Highlighter
                    className={cn(
                      "size-4",
                      editorState.isHighlight
                        ? "text-primary-foreground"
                        : "text-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "absolute right-1.5 bottom-0.5 left-1.5 h-0.5 rounded-full",
                      editorState.isHighlight && "h-1",
                    )}
                    style={{ backgroundColor: currentHighlightColor }}
                  />
                </Button>
                <DropdownMenu
                  open={isHighlightMenuOpen}
                  onOpenChange={(open) =>
                    setIsHighlightMenuOpen(
                      control("highlight").disabled ? false : open,
                    )
                  }
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      title="Choose highlight color"
                      size="icon"
                      variant="ghost"
                      disabled={control("highlight").disabled}
                      className="size-7 cursor-pointer rounded-l-none border-0 border-l border-border/50 bg-transparent px-1.5 sm:size-8"
                    >
                      <ChevronDown className="size-3.5 text-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={8}
                    className="w-56"
                  >
                    <DropdownMenuLabel>Highlight color</DropdownMenuLabel>
                    <div className="grid grid-cols-5 gap-2 px-1 py-2">
                      {HIGHLIGHT_PRESETS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          title={color}
                          aria-label={color}
                          onClick={() => setHighlightColorValue(color)}
                          className={cn(
                            "size-8 cursor-pointer rounded-md border border-border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            currentHighlightColor.toLowerCase() ===
                              color.toLowerCase() && "ring-2 ring-ring",
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <DropdownMenuSeparator />
                    <div className="px-1 py-1">
                      <input
                        type="text"
                        value={customHighlightColor}
                        onChange={(event) =>
                          setCustomHighlightColor(event.target.value)
                        }
                        onKeyDown={(event) => {
                          event.stopPropagation();
                          if (event.key === "Enter") {
                            event.preventDefault();
                            setHighlightColorValue(customHighlightColor);
                          }
                        }}
                        placeholder="#ffcc00"
                        className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <Separator orientation="vertical" className="ml-1" />
          </div>
        )}

        {/* ── GROUP 6: LINK & INLINE CODE ── */}
        {!linkCodeGroup.hidden && (
          <div className={groupClassName(["link", "inlineCode"])}>
            {!control("link").hidden && (
              <MenuBottons
                onClick={handleLinkClick}
                state={editorState.isLink}
                Icon={Link2}
                title="Insert Link"
                disabled={control("link").disabled}
              />
            )}
            {!control("inlineCode").hidden && (
              <MenuBottons
                onClick={() => editor.chain().focus().toggleCode().run()}
                state={editorState.isCode}
                Icon={Code}
                title="Inline Code (CTRL + E)"
                disabled={control("inlineCode").disabled}
              />
            )}
            <Separator orientation="vertical" />
          </div>
        )}

        {/* ── GROUP 7: TEXT ALIGNMENT ── */}
        {!alignGroup.hidden && (
          <div
            className={groupClassName([
              "alignLeft",
              "alignCenter",
              "alignRight",
              "alignJustify",
            ])}
          >
            {/* Desktop: individual buttons */}
            <div className="hidden shrink-0 items-center gap-1 md:flex">
              {!control("alignLeft").hidden && (
                <MenuBottons
                  onClick={() =>
                    editor.chain().focus().toggleTextAlign("left").run()
                  }
                  state={editorState.isAlignLeft}
                  Icon={TextAlignStart}
                  title="Text Align Left (CTRL + SHFT + L)"
                  disabled={control("alignLeft").disabled}
                />
              )}
              {!control("alignCenter").hidden && (
                <MenuBottons
                  onClick={() =>
                    editor.chain().focus().toggleTextAlign("center").run()
                  }
                  state={editorState.isAlignCenter}
                  Icon={TextAlignCenter}
                  title="Text Align Center (CTRL + SHFT + E)"
                  disabled={control("alignCenter").disabled}
                />
              )}
              {!control("alignRight").hidden && (
                <MenuBottons
                  onClick={() =>
                    editor.chain().focus().toggleTextAlign("right").run()
                  }
                  state={editorState.isAlignRight}
                  Icon={TextAlignEnd}
                  title="Text Align Right (CTRL + SHFT + R)"
                  disabled={control("alignRight").disabled}
                />
              )}
              {!control("alignJustify").hidden && (
                <MenuBottons
                  onClick={() =>
                    editor.chain().focus().toggleTextAlign("justify").run()
                  }
                  state={editorState.isAlignJustify}
                  Icon={TextAlignJustify}
                  title="Text Align Justify (CTRL + SHFT + J)"
                  disabled={control("alignJustify").disabled}
                />
              )}
            </div>

            {/* Mobile: dropdown */}
            <div className="flex shrink-0 items-center gap-1 md:hidden">
              <DropdownMenu
                open={isAlignMenuOpen}
                onOpenChange={(open) =>
                  setIsAlignMenuOpen(alignGroup.disabled ? false : open)
                }
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    title="Align"
                    variant="outline"
                    // size="icon"
                    disabled={alignGroup.disabled}
                    className={cn(
                      "h-7 cursor-pointer bg-transparent px-2 sm:h-8",
                      isAnyAlignActive &&
                        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground",
                    )}
                  >
                    <ActiveAlignIcon className={cn("size-4")} />
                    <ChevronDown size={1} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="px-0 py-0 w-48">
                  {!control("alignLeft").hidden && (
                    <TextBlockButton
                      label="Align Left"
                      onClick={() => {
                        editor.chain().focus().toggleTextAlign("left").run();
                        setIsAlignMenuOpen(false);
                      }}
                      disabled={control("alignLeft").disabled}
                      state={editorState.isAlignLeft}
                      title="Text Align Left (CTRL + SHFT + L)"
                    />
                  )}
                  {!control("alignCenter").hidden && (
                    <TextBlockButton
                      label="Align Center"
                      onClick={() => {
                        editor.chain().focus().toggleTextAlign("center").run();
                        setIsAlignMenuOpen(false);
                      }}
                      disabled={control("alignCenter").disabled}
                      state={editorState.isAlignCenter}
                      title="Text Align Center (CTRL + SHFT + E)"
                    />
                  )}
                  {!control("alignRight").hidden && (
                    <TextBlockButton
                      label="Align Right"
                      onClick={() => {
                        editor.chain().focus().toggleTextAlign("right").run();
                        setIsAlignMenuOpen(false);
                      }}
                      disabled={control("alignRight").disabled}
                      state={editorState.isAlignRight}
                      title="Text Align Right (CTRL + SHFT + R)"
                    />
                  )}
                  {!control("alignJustify").hidden && (
                    <TextBlockButton
                      label="Align Justify"
                      onClick={() => {
                        editor.chain().focus().toggleTextAlign("justify").run();
                        setIsAlignMenuOpen(false);
                      }}
                      disabled={control("alignJustify").disabled}
                      state={editorState.isAlignJustify}
                      title="Text Align Justify (CTRL + SHFT + J)"
                    />
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Separator orientation="vertical" />
          </div>
        )}

        {/* ── GROUP 8: LISTS ── */}
        {!listGroup.hidden && (
          <div
            className={groupClassName([
              "bulletList",
              "orderedList",
              "taskList",
            ])}
          >
            {!control("bulletList").hidden && (
              <MenuBottons
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                state={editorState.isBulletList}
                Icon={List}
                title="Bullet List (CTRL + SHIFT + 8)"
                disabled={control("bulletList").disabled}
              />
            )}
            {!control("orderedList").hidden && (
              <MenuBottons
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                state={editorState.isOrderedList}
                Icon={ListOrdered}
                title="Ordered List (CTRL + SHIFT + 7)"
                disabled={control("orderedList").disabled}
              />
            )}
            {!control("taskList").hidden && (
              <MenuBottons
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                state={editorState.isTaskItem}
                Icon={ListTodo}
                title="Task List (CTRL + SHIFT + 9)"
                disabled={control("taskList").disabled}
              />
            )}
            <Separator orientation="vertical" />
          </div>
        )}

        {/* ── GROUP 9: BLOCK ELEMENTS ── */}
        {!blockGroup.hidden && (
          <div
            className={groupClassName([
              "blockquote",
              "codeBlock",
              "horizontalRule",
              "hardBreak",
            ])}
          >
            {!control("blockquote").hidden && (
              <MenuBottons
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                state={editorState.isQuote}
                Icon={MessageSquareQuote}
                title="BlockQuote (CTRL + SHFT + B)"
                disabled={control("blockquote").disabled}
              />
            )}
            {!control("codeBlock").hidden && (
              <MenuBottons
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                state={editorState.isCodeBlock}
                Icon={Terminal}
                title="Code Block (CTRL + ALT + C)"
                disabled={control("codeBlock").disabled}
              />
            )}
            {!control("horizontalRule").hidden && (
              <MenuBottons
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                state={false}
                Icon={Minus}
                title="Insert Horizontal Rule"
                disabled={control("horizontalRule").disabled}
              />
            )}
            {!control("hardBreak").hidden && (
              <MenuBottons
                onClick={() => editor.chain().focus().setHardBreak().run()}
                state={false}
                Icon={TextWrap}
                title="HardBreak (CTRL + ENTER)"
                disabled={control("hardBreak").disabled}
              />
            )}
            <Separator orientation="vertical" />
          </div>
        )}

        {/* ── GROUP 10: INSERT (Table, Image, YouTube) ── */}
        {!insertGroup.hidden && (
          <div
            className={groupClassName([
              "table",
              "image",
              "imageUpload",
              "youtube",
            ])}
          >
            {!control("table").hidden && (
              <DropdownMenu
                open={isInsertTableDialogOpen}
                onOpenChange={(open) => {
                  if (control("table").disabled) {
                    setIsInsertTableDialogOpen(false);
                    return;
                  }

                  if (open) {
                    resetTableDialog();
                  } else {
                    setIsInsertTableDialogOpen(false);
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    title="Insert table"
                    variant="ghost"
                    size="icon"
                    disabled={control("table").disabled}
                    className={cn(
                      "size-7 cursor-pointer bg-transparent sm:size-8",
                      editorState.isTable &&
                        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground",
                    )}
                  >
                    <Table2
                      className={cn(
                        "size-4",
                        editorState.isTable
                          ? "text-primary-foreground"
                          : "text-foreground",
                      )}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  sideOffset={10}
                  className="tr-table-picker-dropdown w-auto p-3"
                  onCloseAutoFocus={(event) => event.preventDefault()}
                >
                  <div
                    className="tr-table-picker"
                    onMouseLeave={() => setHoveredTableSize(null)}
                  >
                    {Array.from({ length: TABLE_PICKER_ROWS }, (_, rowIndex) =>
                      Array.from(
                        { length: TABLE_PICKER_COLS },
                        (_, colIndex) => {
                          const rows = rowIndex + 1;
                          const cols = colIndex + 1;
                          const isActive =
                            rows <= selectedTableRows &&
                            cols <= selectedTableCols;

                          return (
                            <button
                              key={`${rows}-${cols}`}
                              type="button"
                              aria-label={`Insert ${rows} by ${cols} table`}
                              className={cn(
                                "tr-table-picker-cell",
                                isActive && "tr-table-picker-cell-active",
                              )}
                              onFocus={() =>
                                setHoveredTableSize({ rows, cols })
                              }
                              onMouseEnter={() =>
                                setHoveredTableSize({ rows, cols })
                              }
                              onClick={() => handleInsertTable(rows, cols)}
                            />
                          );
                        },
                      ),
                    )}
                  </div>

                  <div className="tr-table-picker-meta">
                    <label
                      htmlFor="table-header-row"
                      className="tr-table-picker-checkbox"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Input
                        id="table-header-row"
                        type="checkbox"
                        checked={tableWithHeaderRow}
                        onChange={(event) =>
                          setTableWithHeaderRow(event.target.checked)
                        }
                        className="size-4"
                      />
                      Include Header
                    </label>

                    <span className="tr-table-picker-size">
                      {selectedTableRows} x {selectedTableCols}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="tr-table-picker-delete"
                    disabled={!editorState.isTable}
                    onClick={() => {
                      editor.chain().focus().deleteTable().run();
                      setIsInsertTableDialogOpen(false);
                    }}
                  >
                    Delete Table
                  </button>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {!control("image").hidden && (
              <MenuBottons
                onClick={handleImageClick}
                state={editorState.isImage}
                Icon={ImagePlus}
                title="Insert remote image"
                disabled={control("image").disabled}
              />
            )}

            {!control("imageUpload").hidden && (
              <ImageUploadButton
                editor={editor}
                text=""
                disabled={control("imageUpload").disabled}
                hideWhenUnavailable={true}
                onInserted={() => console.log("Image inserted!")}
                className="size-7 px-0 sm:size-8"
              />
            )}

            {!control("youtube").hidden && (
              <MenuBottons
                onClick={openYoutubeDialog}
                state={editorState.isYoutube}
                Icon={Video}
                title="Embed YouTube video"
                disabled={control("youtube").disabled}
              />
            )}
          </div>
        )}

        {hasOnSave && (
          <div className="flex shrink-0 items-center gap-1">
            <Separator orientation="vertical" />

            <MenuBottons
              onClick={handleUserSaveAction}
              state={false}
              Icon={Save}
              title="Save"
            />
          </div>
        )}
      </div>

      {/* ── DIALOGS ── */}

      {/* LINK DIALOG */}
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

      {/* YOUTUBE DIALOG */}
      <Dialog open={isYoutubeDialogOpen} onOpenChange={setIsYoutubeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editorState.isYoutube
                ? "Edit YouTube video"
                : "Embed YouTube video"}
            </DialogTitle>
            <DialogDescription>
              Paste a YouTube or YouTube Music link. Choose a size or use full
              width to match the editor.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmitYoutube();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="youtube-url">Video URL</Label>
              <Input
                id="youtube-url"
                autoFocus
                type="url"
                required
                value={youtubeUrl}
                onChange={(event) => setYoutubeUrl(event.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
              />
            </div>
            <div className="flex items-center gap-2 text-sm w-fit cursor-pointer select-none">
              <Input
                id="youtube-full-width"
                type="checkbox"
                checked={youtubeFullWidth}
                onChange={(event) => setYoutubeFullWidth(event.target.checked)}
                className="size-4"
              />
              <Label htmlFor="youtube-full-width" className="cursor-pointer">
                Full width (match editor)
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="youtube-width">Width (px)</Label>
                <Input
                  id="youtube-width"
                  type="number"
                  min={1}
                  disabled={youtubeFullWidth}
                  value={youtubeWidth}
                  onChange={(event) =>
                    setYoutubeWidth(Number(event.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube-height">Height (px)</Label>
                <Input
                  id="youtube-height"
                  type="number"
                  min={1}
                  disabled={youtubeFullWidth}
                  value={youtubeHeight}
                  onChange={(event) =>
                    setYoutubeHeight(Number(event.target.value))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsYoutubeDialogOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" className="cursor-pointer">
                {editorState.isYoutube ? "Update video" : "Insert video"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* IMAGE DIALOG */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert image</DialogTitle>
            <DialogDescription>
              Add image URL, optional alt text, optional title, and display mode.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmitImage();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                autoFocus
                type="url"
                required
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://example.com/image.png"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-alt">Alt text (optional)</Label>
              <Input
                id="image-alt"
                type="text"
                value={imageAlt}
                onChange={(event) => setImageAlt(event.target.value)}
                placeholder="Describe the image for accessibility"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-title">Title (optional)</Label>
              <Input
                id="image-title"
                type="text"
                value={imageTitle}
                onChange={(event) => setImageTitle(event.target.value)}
                placeholder="Image title tooltip"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/70 px-3 py-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={imageInline}
                onChange={(event) => setImageInline(event.target.checked)}
                className="size-4 accent-current"
              />
              <span>Inline image</span>
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsImageDialogOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" className="cursor-pointer">
                Insert image
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

type MenuButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  onClick: () => void;
  state: boolean;
  Icon: LucideIcon;
  title: string;
  className?: string;
};

function MenuBottons({
  onClick,
  state,
  Icon,
  title,
  className,
  ...props
}: MenuButtonProps) {
  return (
    <Button
      title={title}
      onClick={onClick}
      variant="ghost"
      size="icon"
      className={cn(
        "size-7 cursor-pointer bg-transparent sm:size-8",
        className,
        state &&
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground",
      )}
      {...props}
    >
      <Icon
        className={cn(
          "size-4",
          state ? "text-primary-foreground" : "text-foreground",
        )}
      />
    </Button>
  );
}

type TextBlockButtonProps = {
  disabled?: boolean;
  state: boolean;
  onClick: () => void;
  label: string;
  title: string;
};

function TextBlockButton({
  disabled = false,
  label,
  onClick,
  state,
  title,
}: TextBlockButtonProps) {
  return (
    <Button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full rounded-none text-sm cursor-pointer",
        state
          ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground"
          : "bg-transparent text-foreground",
        !state && "hover:bg-foreground/5",
      )}
    >
      {label}
    </Button>
  );
}

function HeadingsIcon({ label }: { label: string }) {
  return (
    <span>
      H<span className="text-[10px] ml-px">{label}</span>
    </span>
  );
}
