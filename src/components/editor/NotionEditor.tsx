import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { EditorContent } from "@tiptap/react";
import DragHandle from "./LazyDragHandle";
import { isValidYoutubeUrl } from "@tiptap/extension-youtube";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import {
  CheckSquare,
  Code2,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  List,
  ListOrdered,
  Pilcrow,
  Plus,
  Quote,
  SeparatorHorizontal,
  Table2,
  Video,
  WrapText,
} from "lucide-react";

import NotionBubbleMenu, {
  NOTION_BUBBLE_MENU_PLUGIN_KEY,
} from "./NotionBubbleMenu";
import YoutubeBubbleMenu from "./YoutubeBubbleMenu";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { cn } from "../../lib/utils";
import type { EditorExtensionName, NotionEditorProps } from "./types/editors";
import { ThemeProvider, useTheme } from "../theme-provider";
import {
  isExtensionDisabled,
  isExtensionHidden,
  shouldBlockExtensionShortcut,
} from "./extension-state";

type SlashCommand = {
  extension: EditorExtensionName;
  group: "Insert" | "Style" | "Upload";
  id: string;
  title: string;
  hint: string;
  aliases: string[];
  icon: typeof Pilcrow;
  iconLabel?: string;
  run: () => void;
};

type SlashMenuState = {
  open: boolean;
  query: string;
  range: {
    from: number;
    to: number;
  };
  position: {
    top: number;
    left: number;
  };
  trigger: "button" | "slash" | null;
};

type SlashDecorationMeta = {
  active: boolean;
  from: number;
  to: number;
  showFilterPlaceholder: boolean;
};

const slashDecorationPluginKey = new PluginKey("notionSlashDecoration");

const DEFAULT_SLASH_MENU_STATE: SlashMenuState = {
  open: false,
  query: "",
  range: {
    from: 0,
    to: 0,
  },
  position: {
    top: 0,
    left: 0,
  },
  trigger: null,
};

function createSlashDecorationPlugin() {
  return new Plugin({
    key: slashDecorationPluginKey,
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(transaction, previousDecorations) {
        const meta = transaction.getMeta(slashDecorationPluginKey) as
          | SlashDecorationMeta
          | undefined;

        if (!meta) {
          return previousDecorations.map(transaction.mapping, transaction.doc);
        }

        if (!meta.active || meta.from >= meta.to) {
          return DecorationSet.empty;
        }

        const decorations = [
          Decoration.inline(meta.from, meta.to, {
            class: cn(
              "notion-slash-query",
              meta.showFilterPlaceholder &&
                "notion-slash-query-with-placeholder",
            ),
          }),
        ];

        if (meta.showFilterPlaceholder) {
          decorations.push(
            Decoration.widget(
              meta.to,
              () => {
                const placeholder = document.createElement("span");
                placeholder.className = "notion-slash-query-placeholder";
                placeholder.textContent = "Filter...";

                return placeholder;
              },
              {
                side: 1,
              },
            ),
          );
        }

        return DecorationSet.create(transaction.doc, decorations);
      },
    },
    props: {
      decorations(state) {
        return slashDecorationPluginKey.getState(state);
      },
    },
  });
}

function isSameSlashMenuState(current: SlashMenuState, next: SlashMenuState) {
  return (
    current.open === next.open &&
    current.query === next.query &&
    current.range.from === next.range.from &&
    current.range.to === next.range.to &&
    current.position.top === next.position.top &&
    current.position.left === next.position.left &&
    current.trigger === next.trigger
  );
}

function mergeStableSlashMenuPosition(
  current: SlashMenuState,
  next: SlashMenuState,
): SlashMenuState {
  const isSameQuerySession =
    current.open &&
    next.open &&
    current.range.from === next.range.from &&
    next.range.to >= current.range.from;

  if (!isSameQuerySession) return next;

  return {
    ...next,
    position: current.position,
  };
}

function getSlashMenuState(
  editor: NotionEditorProps["editor"],
): SlashMenuState {
  const { state, view } = editor;
  const { selection } = state;

  if (!selection.empty) return DEFAULT_SLASH_MENU_STATE;

  const { $from } = selection;
  const textBefore = $from.parent.textBetween(
    0,
    $from.parentOffset,
    "\n",
    "\0",
  );
  const match = /(?:^|\s)\/([\w-]*)$/.exec(textBefore);

  if (!match) return DEFAULT_SLASH_MENU_STATE;

  const query = match[1] ?? "";
  const slashOffset = textBefore.length - query.length - 1;
  const from = $from.start() + slashOffset;
  const to = $from.pos;
  const coords = view.coordsAtPos(to);
  const editorRect = view.dom.getBoundingClientRect();

  return {
    open: true,
    query,
    range: {
      from,
      to,
    },
    position: {
      top: coords.bottom - editorRect.top + 8,
      left: Math.max(0, coords.left - editorRect.left),
    },
    trigger: "slash",
  };
}

function updateSlashDecoration(
  editor: NotionEditorProps["editor"],
  slashMenuState: SlashMenuState,
) {
  if (editor.isDestroyed) return;

  editor.view.dispatch(
    editor.state.tr.setMeta(slashDecorationPluginKey, {
      active: slashMenuState.open,
      from: slashMenuState.range.from,
      to: slashMenuState.range.to,
      showFilterPlaceholder:
        slashMenuState.open &&
        slashMenuState.query.length === 0 &&
        slashMenuState.range.to > slashMenuState.range.from,
    } satisfies SlashDecorationMeta),
  );
}

function hideNotionBubbleMenu(editor: NotionEditorProps["editor"]) {
  if (editor.isDestroyed) return;

  editor.view.dispatch(
    editor.state.tr.setMeta(NOTION_BUBBLE_MENU_PLUGIN_KEY, "hide"),
  );
}

function getSlashMenuStateAtSelection(
  editor: NotionEditorProps["editor"],
): SlashMenuState {
  const { state, view } = editor;
  const { selection } = state;
  const coords = view.coordsAtPos(selection.from);
  const editorRect = view.dom.getBoundingClientRect();

  return {
    open: true,
    query: "",
    range: {
      from: selection.from,
      to: selection.from,
    },
    position: {
      top: coords.bottom - editorRect.top + 8,
      left: Math.max(0, coords.left - editorRect.left),
    },
    trigger: "button",
  };
}

function NotionEditorInner({
  editor,
  className,
  extensionState,
  enableBubbleMenu = true,
}: NotionEditorProps) {
  const { resolvedTheme } = useTheme();
  const [slashMenu, setSlashMenu] = useState<SlashMenuState>(
    DEFAULT_SLASH_MENU_STATE,
  );
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);
  const editorRootRef = useRef<HTMLDivElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const slashCommandListRef = useRef<HTMLDivElement>(null);
  const slashCommandItemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const dismissedSlashRangeRef = useRef<SlashMenuState["range"] | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("https://");
  const [imageAlt, setImageAlt] = useState("");
  const [imageTitle, setImageTitle] = useState("");
  const [isInsertTableDialogOpen, setIsInsertTableDialogOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableWithHeaderRow, setTableWithHeaderRow] = useState(true);
  const [isYoutubeDialogOpen, setIsYoutubeDialogOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeWidth, setYoutubeWidth] = useState(640);
  const [youtubeHeight, setYoutubeHeight] = useState(480);
  const [youtubeFullWidth, setYoutubeFullWidth] = useState(false);
  const [isListDragTarget, setIsListDragTarget] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 640px)").matches,
  );

  const handleDragNodeChange = useCallback(
    ({ node }: { node: ProseMirrorNode | null }) => {
      const nodeName = node?.type.name;
      setIsListDragTarget(
        nodeName === "listItem" ||
          nodeName === "taskItem" ||
          nodeName === "bulletList" ||
          nodeName === "orderedList",
      );
    },
    [],
  );
  const deleteSlashQuery = useCallback(
    (range: SlashMenuState["range"] = slashMenu.range) => {
      if (range.to <= range.from) return;

      editor
        .chain()
        .focus()
        .deleteRange({
          from: range.from,
          to: range.to,
        })
        .run();
    },
    [editor, slashMenu.range],
  );

  const clearSlashDecoration = useCallback(() => {
    updateSlashDecoration(editor, DEFAULT_SLASH_MENU_STATE);
  }, [editor]);

  const closeSlashMenu = useCallback((rememberDismissedRange = false) => {
    setSlashMenu((currentSlashMenu) => {
      if (rememberDismissedRange) {
        dismissedSlashRangeRef.current = currentSlashMenu.open
          ? currentSlashMenu.range
          : null;
      }

      return DEFAULT_SLASH_MENU_STATE;
    });
    setActiveCommandIndex(0);
  }, []);

  const closeFloatingMenus = useCallback(() => {
    closeSlashMenu(true);
    hideNotionBubbleMenu(editor);
  }, [closeSlashMenu, editor]);

  const runCommand = useCallback(
    (command: () => void) => {
      const range = slashMenu.range;

      closeSlashMenu();
      clearSlashDecoration();
      deleteSlashQuery(range);

      queueMicrotask(() => {
        if (!editor.isDestroyed) {
          command();
        }
      });
    },
    [
      clearSlashDecoration,
      closeSlashMenu,
      deleteSlashQuery,
      editor,
      slashMenu.range,
    ],
  );

  const clampTableDimension = (value: number) => {
    if (!Number.isFinite(value)) return 1;
    return Math.min(50, Math.max(1, Math.trunc(value)));
  };

  const clampYoutubeDimension = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) return fallback;
    return Math.min(4096, Math.max(1, Math.trunc(value)));
  };

  function handleSubmitImage() {
    const trimmedUrl = imageUrl.trim();

    if (!trimmedUrl) return;

    const trimmedAlt = imageAlt.trim();
    const trimmedTitle = imageTitle.trim();

    editor
      .chain()
      .focus()
      .setImage({
        src: trimmedUrl,
        alt: trimmedAlt || undefined,
        title: trimmedTitle || undefined,
      })
      .run();

    setIsImageDialogOpen(false);
  }

  function handleInsertTable() {
    const rows = clampTableDimension(tableRows);
    const cols = clampTableDimension(tableCols);

    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: tableWithHeaderRow })
      .run();

    setTableRows(rows);
    setTableCols(cols);
    setIsInsertTableDialogOpen(false);
  }

  function handleSubmitYoutube() {
    const trimmedUrl = youtubeUrl.trim();

    if (!trimmedUrl || !isValidYoutubeUrl(trimmedUrl)) return;

    if (youtubeFullWidth) {
      editor
        .chain()
        .focus()
        .setYoutubeVideo({
          src: trimmedUrl,
          width: "100%" as unknown as number,
          height: "100%" as unknown as number,
        })
        .run();
    } else {
      const width = clampYoutubeDimension(youtubeWidth, 640);
      const height = clampYoutubeDimension(youtubeHeight, 480);

      editor
        .chain()
        .focus()
        .setYoutubeVideo({
          src: trimmedUrl,
          width,
          height,
        })
        .run();

      setYoutubeWidth(width);
      setYoutubeHeight(height);
    }

    setIsYoutubeDialogOpen(false);
  }

  const commands = useMemo<SlashCommand[]>(
    () => [
      {
        extension: "heading",
        group: "Style",
        id: "heading-1",
        title: "Heading 1",
        hint: "Large section heading",
        aliases: ["h1", "title"],
        icon: Heading1,
        iconLabel: "H1",
        run: () =>
          editor.chain().focus().setNode("heading", { level: 1 }).run(),
      },
      {
        extension: "heading",
        group: "Style",
        id: "heading-2",
        title: "Heading 2",
        hint: "Medium section heading",
        aliases: ["h2", "subtitle"],
        icon: Heading2,
        iconLabel: "H2",
        run: () =>
          editor.chain().focus().setNode("heading", { level: 2 }).run(),
      },
      {
        extension: "heading",
        group: "Style",
        id: "heading-3",
        title: "Heading 3",
        hint: "Small section heading",
        aliases: ["h3"],
        icon: Heading3,
        iconLabel: "H3",
        run: () =>
          editor.chain().focus().setNode("heading", { level: 3 }).run(),
      },
      {
        extension: "bulletList",
        group: "Style",
        id: "bullet-list",
        title: "Bullet List",
        hint: "Simple unordered list",
        aliases: ["ul", "list"],
        icon: List,
        run: () => editor.chain().focus().toggleBulletList().run(),
      },
      {
        extension: "orderedList",
        group: "Style",
        id: "numbered-list",
        title: "Numbered List",
        hint: "Ordered list",
        aliases: ["ol", "ordered"],
        icon: ListOrdered,
        run: () => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        extension: "taskList",
        group: "Style",
        id: "task-list",
        title: "To-do List",
        hint: "Checkbox list",
        aliases: ["todo", "checkbox", "check"],
        icon: CheckSquare,
        run: () => editor.chain().focus().toggleTaskList().run(),
      },
      {
        extension: "blockquote",
        group: "Style",
        id: "quote",
        title: "Blockquote",
        hint: "Indented callout text",
        aliases: ["blockquote"],
        icon: Quote,
        run: () => editor.chain().focus().toggleBlockquote().run(),
      },
      {
        extension: "inlineCode",
        group: "Style",
        id: "inline-code",
        title: "Inline code",
        hint: "Code style for selected text",
        aliases: ["code", "inline", "monospace"],
        icon: Code2,
        run: () => editor.chain().focus().toggleCode().run(),
      },
      {
        extension: "codeBlock",
        group: "Style",
        id: "code",
        title: "Code block",
        hint: "Code with highlighting",
        aliases: ["pre", "block"],
        icon: Code2,
        run: () => editor.chain().focus().toggleCodeBlock().run(),
      },
      {
        extension: "horizontalRule",
        group: "Insert",
        id: "horizontal-rule",
        title: "Separator",
        hint: "Horizontal rule",
        aliases: ["horizontal", "rule", "hr", "divider", "separator"],
        icon: SeparatorHorizontal,
        run: () => editor.chain().focus().setHorizontalRule().run(),
      },
      {
        extension: "hardBreak",
        group: "Insert",
        id: "hard-break",
        title: "Hard break",
        hint: "Line break",
        aliases: ["break", "line", "newline", "br"],
        icon: WrapText,
        run: () => editor.chain().focus().setHardBreak().run(),
      },
      {
        extension: "table",
        group: "Insert",
        id: "table",
        title: "Table",
        hint: "Choose rows and columns",
        aliases: ["grid"],
        icon: Table2,
        run: () => setIsInsertTableDialogOpen(true),
      },
      {
        extension: "youtube",
        group: "Insert",
        id: "youtube",
        title: "YouTube Embed",
        hint: "Embed a YouTube video",
        aliases: ["video", "embed", "youtube", "yt"],
        icon: Video,
        run: () => {
          setYoutubeUrl("");
          setYoutubeWidth(640);
          setYoutubeHeight(480);
          setYoutubeFullWidth(false);
          setIsYoutubeDialogOpen(true);
        },
      },
      {
        extension: "image",
        group: "Insert",
        id: "remote-image",
        title: "Remote image",
        hint: "Insert an image from URL",
        aliases: ["image", "photo", "picture", "url"],
        icon: ImageIcon,
        run: () => {
          const imageAttributes = editor.getAttributes("image") as {
            src?: string;
            alt?: string;
            title?: string;
          };

          setImageUrl(imageAttributes.src ?? "https://");
          setImageAlt(imageAttributes.alt ?? "");
          setImageTitle(imageAttributes.title ?? "");
          setIsImageDialogOpen(true);
        },
      },
      {
        extension: "imageUpload",
        group: "Upload",
        id: "upload-image",
        title: "Upload image",
        hint: "Upload an image",
        aliases: ["image", "photo", "picture", "upload"],
        icon: ImageIcon,
        run: () => editor.chain().focus().setImageUploadNode().run(),
      },
    ],
    [editor],
  );

  const visibleCommands = useMemo(() => {
    const query = slashMenu.query.toLowerCase();

    const availableCommands = commands.filter(
      (command) => !isExtensionHidden(extensionState, command.extension),
    );

    if (!query) return availableCommands;

    return availableCommands.filter((command) => {
      const values = [command.title, command.id, ...command.aliases];
      return values.some((value) => value.toLowerCase().includes(query));
    });
  }, [commands, extensionState, slashMenu.query]);

  const visibleCommandGroups = useMemo(
    () =>
      (["Style", "Insert", "Upload"] as const)
        .map((group) => ({
          group,
          commands: visibleCommands.filter(
            (command) => command.group === group,
          ),
        }))
        .filter(({ commands }) => commands.length > 0),
    [visibleCommands],
  );
  const activeCommandValue =
    visibleCommands[Math.min(activeCommandIndex, visibleCommands.length - 1)]
      ?.id ?? "";

  const handleCommandValueChange = useCallback(
    (value: string) => {
      const index = visibleCommands.findIndex(
        (command) => command.id === value,
      );

      if (index >= 0) {
        setActiveCommandIndex(index);
      }
    },
    [visibleCommands],
  );

  const updateSlashMenu = useCallback(() => {
    const nextSlashMenu = mergeStableSlashMenuPosition(
      slashMenu,
      getSlashMenuState(editor),
    );
    const dismissedRange = dismissedSlashRangeRef.current;

    if (
      dismissedRange &&
      nextSlashMenu.open &&
      nextSlashMenu.range.from === dismissedRange.from &&
      nextSlashMenu.range.to === dismissedRange.to
    ) {
      if (slashMenu.open) {
        setSlashMenu(DEFAULT_SLASH_MENU_STATE);
        setActiveCommandIndex(0);
      }

      return;
    }

    if (
      dismissedRange &&
      (!nextSlashMenu.open ||
        nextSlashMenu.range.from !== dismissedRange.from ||
        nextSlashMenu.range.to !== dismissedRange.to)
    ) {
      dismissedSlashRangeRef.current = null;
    }

    if (slashMenu.trigger === "button" && !nextSlashMenu.open) return;

    if (isSameSlashMenuState(slashMenu, nextSlashMenu)) return;

    setSlashMenu(nextSlashMenu);

    if (slashMenu.query !== nextSlashMenu.query) {
      setActiveCommandIndex(0);
    }
  }, [editor, slashMenu]);

  useEffect(() => {
    editor.registerPlugin(createSlashDecorationPlugin());

    return () => {
      if (!editor.isDestroyed) {
        editor.unregisterPlugin(slashDecorationPluginKey);
      }
    };
  }, [editor]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");

    function handleChange(event: MediaQueryListEvent) {
      setIsSmallScreen(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    let canceled = false;

    queueMicrotask(() => {
      if (!canceled) {
        updateSlashDecoration(editor, slashMenu);
      }
    });

    return () => {
      canceled = true;
    };
  }, [editor, slashMenu]);

  useEffect(() => {
    editor.on("transaction", updateSlashMenu);
    editor.on("selectionUpdate", updateSlashMenu);

    return () => {
      editor.off("transaction", updateSlashMenu);
      editor.off("selectionUpdate", updateSlashMenu);
    };
  }, [editor, updateSlashMenu]);

  useEffect(() => {
    if (!slashMenu.open) return;

    if (activeCommandIndex === 0) {
      slashCommandListRef.current?.scrollTo({
        top: 0,
        behavior: "instant",
      });
      return;
    }

    const activeItem = slashCommandItemRefs.current[activeCommandIndex];

    activeItem?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [activeCommandIndex, slashMenu.open]);

  useEffect(() => {
    if (!slashMenu.open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        closeSlashMenu(true);
        return;
      }

      if (slashMenuRef.current?.contains(target)) {
        return;
      }

      if (
        target instanceof Element &&
        target.closest(".notion-block-controls")
      ) {
        return;
      }

      closeSlashMenu(true);
    }

    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [closeSlashMenu, slashMenu.open]);

  useEffect(() => {
    function handleDocumentPointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        closeFloatingMenus();
        return;
      }

      if (editorRootRef.current?.contains(target)) {
        return;
      }

      if (
        target instanceof Element &&
        target.closest(
          [
            ".notion-slash-menu",
            ".tr-notion-selection-bubble",
            ".notion-bubble-local-menu",
            ".notion-block-controls",
            "[role='dialog']",
          ].join(", "),
        )
      ) {
        return;
      }

      closeFloatingMenus();
    }

    function handleDocumentKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;

      closeFloatingMenus();
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown, true);
    document.addEventListener("keydown", handleDocumentKeyDown, true);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleDocumentPointerDown,
        true,
      );
      document.removeEventListener("keydown", handleDocumentKeyDown, true);
    };
  }, [closeFloatingMenus]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (shouldBlockExtensionShortcut(event, extensionState)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (!slashMenu.open || visibleCommands.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      setActiveCommandIndex((index) =>
        Math.min(index + 1, visibleCommands.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      setActiveCommandIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      event.stopPropagation();
      const command =
        visibleCommands[
          Math.min(activeCommandIndex, visibleCommands.length - 1)
        ];
      if (isExtensionDisabled(extensionState, command.extension)) return;

      runCommand(command.run);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeSlashMenu(true);
    }
  }

  function handlePlusMouseDown(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    editor.chain().focus().run();
    const nextSlashMenu = getSlashMenuStateAtSelection(editor);

    dismissedSlashRangeRef.current = null;
    setSlashMenu(nextSlashMenu);
    setActiveCommandIndex(0);
  }

  const hasFullHeightLayout =
    !!className && /\bh-(full|screen|dvh|svh|lvh)\b/.test(className);

  useEffect(() => {
    const editorElement = editor.view.dom;

    editorElement.classList.add("tr-notion-tiptap");

    return () => {
      editorElement.classList.remove("tr-notion-tiptap");
    };
  }, [editor]);

  return (
    <div
      ref={editorRootRef}
      className={cn(
        "w-full tr-editor sm:px-10! rounded",
        hasFullHeightLayout && "h-full",
        resolvedTheme === "dark" && "dark",
        className,
      )}
    >
      <div
        className={cn(
          "tr-editor-shell tr-notion-editor-shell relative flex flex-col",
          hasFullHeightLayout && "h-full min-h-0",
        )}
        onKeyDownCapture={handleKeyDown}
      >
        <div
          className={cn(
            "notion-editor-canvas",
            hasFullHeightLayout && "flex min-h-0 flex-1 flex-col",
          )}
        >
          {enableBubbleMenu && (
            <NotionBubbleMenu
              editor={editor}
              extensionState={extensionState}
            />
          )}
          <YoutubeBubbleMenu editor={editor} />

          <EditorContent
            editor={editor}
            className={cn(
              "notion-editor-content",
              hasFullHeightLayout && "min-h-0 flex-1 [&>.tiptap]:max-h-full",
            )}
          />

          {slashMenu.open && (
            <Command
              ref={slashMenuRef}
              shouldFilter={false}
              loop={false}
              disablePointerSelection
              value={activeCommandValue}
              onValueChange={handleCommandValueChange}
              className="notion-slash-menu"
              style={{
                top: slashMenu.position.top,
                left: slashMenu.position.left,
              }}
              onMouseDown={(event) => event.preventDefault()}
            >
              <div className="notion-slash-menu-title">Command Box</div>
              {visibleCommands.length > 0 ? (
                <CommandList
                  ref={slashCommandListRef}
                  className="notion-slash-command-list"
                >
                  {visibleCommandGroups.map((group, groupIndex) => {
                    const previousItemsCount = visibleCommandGroups
                      .slice(0, groupIndex)
                      .reduce((count, item) => count + item.commands.length, 0);

                    return (
                      <CommandGroup
                        key={group.group}
                        heading={
                          <div className="notion-slash-menu-section-label">
                            {group.group}
                          </div>
                        }
                        className="notion-slash-menu-section"
                      >
                        {group.commands.map((command, commandIndex) => {
                          const Icon = command.icon;
                          const index = previousItemsCount + commandIndex;
                          const selected = index === activeCommandIndex;
                          const disabled = isExtensionDisabled(
                            extensionState,
                            command.extension,
                          );

                          return (
                            <CommandItem
                              key={command.id}
                              ref={(element) => {
                                slashCommandItemRefs.current[index] = element;
                              }}
                              value={command.id}
                              disabled={disabled}
                              keywords={command.aliases}
                              className={cn(
                                "notion-slash-menu-item",
                                selected && "notion-slash-menu-item-active",
                                disabled && "opacity-50",
                              )}
                              onSelect={() => {
                                if (!disabled) {
                                  runCommand(command.run);
                                }
                              }}
                            >
                              <span className="notion-slash-menu-icon">
                                {command.iconLabel ? (
                                  <span className="notion-slash-menu-type-icon">
                                    {command.iconLabel}
                                  </span>
                                ) : (
                                  <Icon className="size-4" />
                                )}
                              </span>
                              <span className="notion-slash-menu-label">
                                <span>{command.title}</span>
                              </span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    );
                  })}
                </CommandList>
              ) : (
                <CommandEmpty className="notion-slash-menu-empty">
                  No commands found
                </CommandEmpty>
              )}
            </Command>
          )}

          <DragHandle
            editor={editor}
            className={cn(
              "notion-block-controls z-5000",
              isListDragTarget && "notion-block-controls-list",
              isSmallScreen && "notion-block-controls-mobile",
            )}
            computePositionConfig={{
              placement: isSmallScreen ? "right" : "left",
              strategy: "absolute",
            }}
            onNodeChange={handleDragNodeChange}
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
            <div className="notion-block-control-group">
              {!isSmallScreen && (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Add block"
                  className="notion-block-control-button"
                  onMouseDown={handlePlusMouseDown}
                >
                  <Plus className="size-4" />
                </button>
              )}

              <button
                type="button"
                tabIndex={-1}
                aria-label="Drag block"
                className="notion-block-control-button cursor-grab"
              >
                <GripVertical className="size-4" />
              </button>
            </div>
          </DragHandle>
        </div>
      </div>

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert image</DialogTitle>
            <DialogDescription>
              Paste a remote image URL and optional accessibility text.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmitImage();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="notion-image-url">Image URL</Label>
              <Input
                id="notion-image-url"
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://example.com/image.png"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notion-image-alt">Alt text</Label>
              <Input
                id="notion-image-alt"
                value={imageAlt}
                onChange={(event) => setImageAlt(event.target.value)}
                placeholder="Describe this image"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notion-image-title">Title</Label>
              <Input
                id="notion-image-title"
                value={imageTitle}
                onChange={(event) => setImageTitle(event.target.value)}
                placeholder="Image title tooltip"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsImageDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Insert image</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isYoutubeDialogOpen} onOpenChange={setIsYoutubeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Embed YouTube video</DialogTitle>
            <DialogDescription>
              Paste a YouTube link and choose a fixed size or full width.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmitYoutube();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="notion-youtube-url">Video URL</Label>
              <Input
                id="notion-youtube-url"
                autoFocus
                required
                type="url"
                value={youtubeUrl}
                onChange={(event) => setYoutubeUrl(event.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <label
              htmlFor="notion-youtube-full-width"
              className="flex w-fit cursor-pointer items-center gap-2 text-sm"
            >
              <Input
                id="notion-youtube-full-width"
                type="checkbox"
                checked={youtubeFullWidth}
                onChange={(event) => setYoutubeFullWidth(event.target.checked)}
                className="size-4"
              />
              Full width
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="notion-youtube-width">Width</Label>
                <Input
                  id="notion-youtube-width"
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
                <Label htmlFor="notion-youtube-height">Height</Label>
                <Input
                  id="notion-youtube-height"
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
              >
                Cancel
              </Button>
              <Button type="submit">Insert video</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isInsertTableDialogOpen}
        onOpenChange={setIsInsertTableDialogOpen}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Insert table</DialogTitle>
            <DialogDescription>
              Choose the number of rows and columns for the new table.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleInsertTable();
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="notion-table-rows">Rows</Label>
                <Input
                  id="notion-table-rows"
                  type="number"
                  min={1}
                  max={50}
                  value={tableRows}
                  onChange={(event) => setTableRows(Number(event.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notion-table-cols">Columns</Label>
                <Input
                  id="notion-table-cols"
                  type="number"
                  min={1}
                  max={50}
                  value={tableCols}
                  onChange={(event) => setTableCols(Number(event.target.value))}
                />
              </div>
            </div>

            <label
              htmlFor="notion-table-header-row"
              className="flex items-center gap-2 text-sm"
            >
              <input
                id="notion-table-header-row"
                type="checkbox"
                checked={tableWithHeaderRow}
                onChange={(event) =>
                  setTableWithHeaderRow(event.target.checked)
                }
              />
              Include header row
            </label>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInsertTableDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Insert table</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function NotionEditor({
  editor,
  mode = "light",
  ...props
}: NotionEditorProps) {
  if (!editor) return null;

  return (
    <ThemeProvider
      defaultTheme={mode}
      storageKey="tiptap-react-ui-notion-theme-mode"
      enableStorage={false}
      resetThemeKey={mode}
    >
      <NotionEditorInner editor={editor} {...props} />
    </ThemeProvider>
  );
}
