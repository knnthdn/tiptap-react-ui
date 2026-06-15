"use client";

import type { Editor } from "@tiptap/core";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
  createTable,
} from "@tiptap/extension-table";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import {
  TableMap,
  findTable,
  selectionCell,
  toggleHeader,
} from "@tiptap/pm/tables";

import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";

import {
  ChevronDown,
  MoveLeft,
  MoveRight,
  PanelLeft,
  PanelTop,
  SquareDashedTopSolid,
  SquareMinus,
  TableColumnsSplit,
  TableRowsSplit,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils";

type TableAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  run: (editor: Editor) => boolean;
  destructive?: boolean;
  activeKey?: keyof TableHeaderActivity;
};

type TableHeaderActivity = {
  headerRow: boolean;
  headerColumn: boolean;
  headerCell: boolean;
};

type ColumnSwap = {
  sourceNode: ProseMirrorNode;
  sourcePos: number;
  targetNode: ProseMirrorNode;
  targetPos: number;
};

const defaultHeaderActivity: TableHeaderActivity = {
  headerRow: false,
  headerColumn: false,
  headerCell: false,
};

function isHeaderCell(node: ProseMirrorNode | null | undefined) {
  return node?.type.name === "tableHeader";
}

function resolveEditorPosition(editor: Editor, position: number | null) {
  if (
    position === null ||
    !Number.isInteger(position) ||
    position < 0 ||
    position > editor.state.doc.content.size
  ) {
    return null;
  }

  try {
    return editor.state.doc.resolve(position);
  } catch {
    return null;
  }
}

function getHeaderActivity(
  editor: Editor,
  cellPosition: number | null,
  cellNode: ProseMirrorNode,
): TableHeaderActivity {
  const fallbackActivity = {
    ...defaultHeaderActivity,
    headerCell: isHeaderCell(cellNode),
  };

  const $cell = resolveEditorPosition(editor, cellPosition);
  if (!$cell) return fallbackActivity;

  try {
    const table = findTable($cell);

    if (!table || cellPosition === null) {
      return fallbackActivity;
    }

    const tableMap = TableMap.get(table.node);
    const cellOffset = cellPosition - table.start;
    const cellRect = tableMap.findCell(cellOffset);
    const rowOffsets = new Set<number>();
    const columnOffsets = new Set<number>();

    for (let column = 0; column < tableMap.width; column += 1) {
      rowOffsets.add(tableMap.map[cellRect.top * tableMap.width + column]);
    }

    for (let row = 0; row < tableMap.height; row += 1) {
      columnOffsets.add(tableMap.map[row * tableMap.width + cellRect.left]);
    }

    const isHeaderAtOffset = (offset: number) =>
      isHeaderCell(table.node.nodeAt(offset));

    return {
      headerRow: [...rowOffsets].every(isHeaderAtOffset),
      headerColumn: [...columnOffsets].every(isHeaderAtOffset),
      headerCell: isHeaderCell(cellNode),
    };
  } catch {
    return fallbackActivity;
  }
}

function swapCurrentColumn(editor: Editor, direction: -1 | 1) {
  try {
    const { state, view } = editor;

    if (!editor.can().focus()) return false;

    const $cell = selectionCell(state);
    const table = findTable($cell);

    if (!table) return false;

    const tableMap = TableMap.get(table.node);
    const currentCellRect = tableMap.findCell($cell.pos - table.start);
    const sourceColumn = currentCellRect.left;
    const targetColumn = sourceColumn + direction;

    if (targetColumn < 0 || targetColumn >= tableMap.width) {
      return false;
    }

    const swaps: ColumnSwap[] = [];

    for (let row = 0; row < tableMap.height; row += 1) {
      const sourceCellOffset =
        tableMap.map[row * tableMap.width + sourceColumn];
      const targetCellOffset =
        tableMap.map[row * tableMap.width + targetColumn];

      if (sourceCellOffset === targetCellOffset) {
        return false;
      }

      const sourceRect = tableMap.findCell(sourceCellOffset);
      const targetRect = tableMap.findCell(targetCellOffset);

      if (
        sourceRect.left !== sourceColumn ||
        sourceRect.right !== sourceColumn + 1 ||
        targetRect.left !== targetColumn ||
        targetRect.right !== targetColumn + 1
      ) {
        return false;
      }

      const sourcePos = table.start + sourceCellOffset;
      const targetPos = table.start + targetCellOffset;
      const sourceNode = table.node.nodeAt(sourceCellOffset);
      const targetNode = table.node.nodeAt(targetCellOffset);

      if (!sourceNode || !targetNode) {
        return false;
      }

      swaps.push({
        sourceNode,
        sourcePos,
        targetNode,
        targetPos,
      });
    }

    const tr = state.tr;

    swaps
      .sort(
        (left, right) =>
          Math.max(right.sourcePos, right.targetPos) -
          Math.max(left.sourcePos, left.targetPos),
      )
      .forEach(({ sourceNode, sourcePos, targetNode, targetPos }) => {
        const replacements =
          sourcePos > targetPos
            ? [
                {
                  newNode: targetNode,
                  oldNode: sourceNode,
                  pos: sourcePos,
                },
                {
                  newNode: sourceNode,
                  oldNode: targetNode,
                  pos: targetPos,
                },
              ]
            : [
                {
                  newNode: sourceNode,
                  oldNode: targetNode,
                  pos: targetPos,
                },
                {
                  newNode: targetNode,
                  oldNode: sourceNode,
                  pos: sourcePos,
                },
              ];

        replacements.forEach(({ newNode, oldNode, pos }) => {
          tr.replaceWith(pos, pos + oldNode.nodeSize, newNode);
        });
      });

    view.dispatch(tr.scrollIntoView());
    view.focus();

    return true;
  } catch {
    return false;
  }
}

function toggleCurrentTableHeader(editor: Editor, type: "row" | "column") {
  try {
    const didToggle = toggleHeader(type, {
      useDeprecatedLogic: true,
    })(editor.state, editor.view.dispatch);

    if (didToggle) {
      editor.view.focus();
    }

    return didToggle;
  } catch {
    return false;
  }
}

const insertionActions: TableAction[] = [
  {
    id: "insert-row-above",
    label: "Insert row above",
    icon: TableRowsSplit,
    run: (editor) => editor.chain().focus().addRowBefore().run(),
  },
  {
    id: "insert-row-below",
    label: "Insert row below",
    icon: TableRowsSplit,
    run: (editor) => editor.chain().focus().addRowAfter().run(),
  },
];

const columnInsertionActions: TableAction[] = [
  {
    id: "insert-column-left",
    label: "Insert column left",
    icon: TableColumnsSplit,
    run: (editor) => editor.chain().focus().addColumnBefore().run(),
  },
  {
    id: "insert-column-right",
    label: "Insert column right",
    icon: TableColumnsSplit,
    run: (editor) => editor.chain().focus().addColumnAfter().run(),
  },
];

const removalActions: TableAction[] = [
  {
    id: "delete-row",
    label: "Delete row",
    icon: SquareMinus,
    run: (editor) => editor.chain().focus().deleteRow().run(),
  },
  {
    id: "delete-column",
    label: "Delete column",
    icon: SquareMinus,
    run: (editor) => editor.chain().focus().deleteColumn().run(),
  },
];

const moveActions: TableAction[] = [
  {
    id: "move-column-left",
    label: "Move column left",
    icon: MoveLeft,
    run: (editor) => swapCurrentColumn(editor, -1),
  },
  {
    id: "move-column-right",
    label: "Move column right",
    icon: MoveRight,
    run: (editor) => swapCurrentColumn(editor, 1),
  },
];

const headerActions: TableAction[] = [
  {
    id: "toggle-header-row",
    label: "Header row",
    icon: PanelTop,
    activeKey: "headerRow",
    run: (editor) => toggleCurrentTableHeader(editor, "row"),
  },
  {
    id: "toggle-header-column",
    label: "Header column",
    icon: PanelLeft,
    activeKey: "headerColumn",
    run: (editor) => toggleCurrentTableHeader(editor, "column"),
  },
  {
    id: "toggle-header-cell",
    label: "Header cell",
    icon: SquareDashedTopSolid,
    activeKey: "headerCell",
    run: (editor) => editor.chain().focus().toggleHeaderCell().run(),
  },
];

const destructiveActions: TableAction[] = [
  {
    id: "remove-table",
    label: "Remove table",
    icon: Trash2,
    run: (editor) => editor.chain().focus().deleteTable().run(),
    destructive: true,
  },
];

function TableActionItem({
  action,
  active = false,
  onRun,
}: {
  action: TableAction;
  active?: boolean;
  onRun: (action: TableAction) => void;
}) {
  const Icon = action.icon;

  return (
    <DropdownMenuItem
      data-active={active ? "true" : undefined}
      variant={action.destructive ? "destructive" : "default"}
      className={cn(
        "notion-table-action-item cursor-pointer",
        active && "notion-table-action-item-active",
        action.destructive &&
          "text-red-700 focus:bg-red-700/10 focus:text-red-700 data-[variant=destructive]:text-red-700 data-[variant=destructive]:focus:text-red-700 dark:text-red-700 dark:focus:bg-red-700/20 dark:focus:text-red-600",
      )}
      onSelect={() => {
        onRun(action);
      }}
    >
      <Icon className="size-4" />
      <span>{action.label}</span>
    </DropdownMenuItem>
  );
}

function TableCellNodeView({ editor, node, getPos, selected }: NodeViewProps) {
  const [isCurrentCellActive, setIsCurrentCellActive] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuCellPosition, setMenuCellPosition] = useState<number | null>(null);
  const [headerActivity, setHeaderActivity] = useState<TableHeaderActivity>(
    defaultHeaderActivity,
  );
  const isDarkTable =
    typeof editor.view.dom.closest === "function" &&
    !!editor.view.dom.closest(".tr-editor.dark");
  const menuPortalContainer =
    typeof editor.view.dom.closest === "function"
      ? (editor.view.dom.closest(".tr-editor") as HTMLElement | null)
      : null;

  const getCurrentCellPosition = () => {
    if (typeof getPos !== "function") return null;

    try {
      const position = getPos();
      return typeof position === "number" ? position : null;
    } catch {
      return null;
    }
  };

  const updateHeaderActivity = (cellPosition = getCurrentCellPosition()) => {
    setHeaderActivity(getHeaderActivity(editor, cellPosition, node));
  };

  const selectCellContent = (cellPosition: number) => {
    const contentPosition = cellPosition + 1;

    if (contentPosition >= editor.state.doc.content.size) return;

    const $content = resolveEditorPosition(editor, contentPosition);
    if (!$content) return;

    const selection = TextSelection.near($content);

    editor.view.dispatch(editor.state.tr.setSelection(selection));
  };

  const runTableAction = (action: TableAction) => {
    const cellPosition = menuCellPosition ?? getCurrentCellPosition();

    if (cellPosition !== null) {
      selectCellContent(cellPosition);
    }

    action.run(editor);
  };

  const handleMenuOpenChange = (open: boolean) => {
    if (open) {
      const cellPosition = getCurrentCellPosition();

      setMenuCellPosition(cellPosition);
      updateHeaderActivity(cellPosition);

      if (cellPosition !== null) {
        selectCellContent(cellPosition);
      }
    }

    setIsMenuOpen(open);
  };

  useEffect(() => {
    const updateCellActivity = () => {
      if (typeof getPos !== "function") {
        setIsCurrentCellActive(false);
        return;
      }

      const position = getPos();

      if (typeof position !== "number") {
        setIsCurrentCellActive(false);
        setHeaderActivity(defaultHeaderActivity);
        return;
      }

      const { from, to } = editor.state.selection;
      const nodeFrom = position;
      const nodeTo = position + node.nodeSize;

      setIsCurrentCellActive(nodeFrom <= from && to <= nodeTo);
      setHeaderActivity(getHeaderActivity(editor, position, node));
    };

    updateCellActivity();
    editor.on("selectionUpdate", updateCellActivity);

    return () => {
      editor.off("selectionUpdate", updateCellActivity);
    };
  }, [editor, getPos, node.nodeSize]);

  const showMenu =
    (isCurrentCellActive || selected || isMenuOpen) && editor.isEditable;

  return (
    <NodeViewWrapper className="notion-table-cell">
      {showMenu ? (
        <div className="notion-table-cell-menu" contentEditable={false}>
          <DropdownMenu open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn("notion-table-cell-trigger")}
                aria-label="Open table actions"
              >
                <ChevronDown className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal container={menuPortalContainer ?? undefined}>
              <DropdownMenuContent
                align="end"
                className={cn(
                  "notion-table-actions-menu w-56",
                  isDarkTable && "notion-table-actions-menu-dark",
                )}
              >
                <DropdownMenuLabel className="notion-table-actions-label">
                  Table actions
                </DropdownMenuLabel>
                {headerActions.map((action) => (
                  <TableActionItem
                    key={action.id}
                    action={action}
                    active={
                      action.activeKey
                        ? headerActivity[action.activeKey]
                        : false
                    }
                    onRun={runTableAction}
                  />
                ))}
                <DropdownMenuSeparator className="notion-table-actions-separator" />
                {moveActions.map((action) => (
                  <TableActionItem
                    key={action.id}
                    action={action}
                    onRun={runTableAction}
                  />
                ))}
                <DropdownMenuSeparator className="notion-table-actions-separator" />
                {columnInsertionActions.map((action) => (
                  <TableActionItem
                    key={action.id}
                    action={action}
                    onRun={runTableAction}
                  />
                ))}
                <DropdownMenuSeparator className="notion-table-actions-separator" />
                {insertionActions.map((action) => (
                  <TableActionItem
                    key={action.id}
                    action={action}
                    onRun={runTableAction}
                  />
                ))}
                <DropdownMenuSeparator className="notion-table-actions-separator" />
                {removalActions.map((action) => (
                  <TableActionItem
                    key={action.id}
                    action={action}
                    onRun={runTableAction}
                  />
                ))}
                <DropdownMenuSeparator className="notion-table-actions-separator" />
                {destructiveActions.map((action) => (
                  <TableActionItem
                    key={action.id}
                    action={action}
                    onRun={runTableAction}
                  />
                ))}
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        </div>
      ) : null}

      <NodeViewContent as="div" className="notion-table-cell-content" />
    </NodeViewWrapper>
  );
}

const NotionTable = Table.extend({
  addCommands() {
    return {
      ...this.parent?.(),
      insertTable:
        ({ rows = 3, cols = 3, withHeaderRow = true } = {}) =>
        ({ tr, dispatch, editor }) => {
          const node = createTable(editor.schema, rows, cols, withHeaderRow);

          if (dispatch) {
            const offset = tr.selection.anchor + 1;

            tr.replaceSelectionWith(node)
              .scrollIntoView()
              .setSelection(TextSelection.near(tr.doc.resolve(offset)));
          }

          return true;
        },
    };
  },
}).configure({
  resizable: false,
  renderWrapper: true,
  HTMLAttributes: {
    class: "notion-table",
  },
});

const NotionTableCell = TableCell.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TableCellNodeView, {
      as: "td",
    });
  },
});

const NotionTableHeader = TableHeader.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TableCellNodeView, {
      as: "th",
    });
  },
});

export const NotionTableExtensions = [
  NotionTable,
  NotionTableCell,
  NotionTableHeader,
  TableRow,
];
