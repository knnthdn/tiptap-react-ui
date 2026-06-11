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
import { TableMap, findTable, selectionCell } from "@tiptap/pm/tables";

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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils";

type TableAction = {
  label: string;
  icon: LucideIcon;
  run: (editor: Editor) => boolean;
  destructive?: boolean;
};

type ColumnSwap = {
  sourceNode: ProseMirrorNode;
  sourcePos: number;
  targetNode: ProseMirrorNode;
  targetPos: number;
};

function swapCurrentColumn(editor: Editor, direction: -1 | 1) {
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
    const sourceCellOffset = tableMap.map[row * tableMap.width + sourceColumn];
    const targetCellOffset = tableMap.map[row * tableMap.width + targetColumn];

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
}

const insertionActions: TableAction[] = [
  {
    label: "Insert row above",
    icon: TableRowsSplit,
    run: (editor) => editor.chain().focus().addRowBefore().run(),
  },
  {
    label: "Insert row below",
    icon: TableRowsSplit,
    run: (editor) => editor.chain().focus().addRowAfter().run(),
  },
];

const columnInsertionActions: TableAction[] = [
  {
    label: "Insert column left",
    icon: TableColumnsSplit,
    run: (editor) => editor.chain().focus().addColumnBefore().run(),
  },
  {
    label: "Insert column right",
    icon: TableColumnsSplit,
    run: (editor) => editor.chain().focus().addColumnAfter().run(),
  },
];

const removalActions: TableAction[] = [
  {
    label: "Delete row",
    icon: SquareMinus,
    run: (editor) => editor.chain().focus().deleteRow().run(),
  },
  {
    label: "Delete column",
    icon: SquareMinus,
    run: (editor) => editor.chain().focus().deleteColumn().run(),
  },
];

const moveActions: TableAction[] = [
  {
    label: "Move column left",
    icon: MoveLeft,
    run: (editor) => swapCurrentColumn(editor, -1),
  },
  {
    label: "Move column right",
    icon: MoveRight,
    run: (editor) => swapCurrentColumn(editor, 1),
  },
];

const headerActions: TableAction[] = [
  {
    label: "Header row",
    icon: PanelTop,
    run: (editor) => editor.chain().focus().toggleHeaderRow().run(),
  },
  {
    label: "Header column",
    icon: PanelLeft,
    run: (editor) => editor.chain().focus().toggleHeaderColumn().run(),
  },
  {
    label: "Header cell",
    icon: SquareDashedTopSolid,
    run: (editor) => editor.chain().focus().toggleHeaderCell().run(),
  },
];

const destructiveActions: TableAction[] = [
  {
    label: "Remove table",
    icon: Trash2,
    run: (editor) => editor.chain().focus().deleteTable().run(),
    destructive: true,
  },
];

function TableActionItem({
  action,
  editor,
}: {
  action: TableAction;
  editor: Editor;
}) {
  const Icon = action.icon;

  return (
    <DropdownMenuItem
      variant={action.destructive ? "destructive" : "default"}
      className={cn(
        "notion-table-action-item cursor-pointer",
        action.destructive &&
          "text-red-700 focus:bg-red-700/10 focus:text-red-700 data-[variant=destructive]:text-red-700 data-[variant=destructive]:focus:text-red-700 dark:text-red-700 dark:focus:bg-red-700/20 dark:focus:text-red-600",
      )}
      onSelect={(event) => {
        event.preventDefault();
        action.run(editor);
      }}
    >
      <Icon className="size-4" />
      <span>{action.label}</span>
    </DropdownMenuItem>
  );
}

function TableCellNodeView({ editor, node, getPos, selected }: NodeViewProps) {
  const [isCurrentCellActive, setIsCurrentCellActive] = useState(false);
  const isDarkTable =
    typeof editor.view.dom.closest === "function" &&
    !!editor.view.dom.closest(".dark");

  useEffect(() => {
    const updateCellActivity = () => {
      if (typeof getPos !== "function") {
        setIsCurrentCellActive(false);
        return;
      }

      const position = getPos();

      if (typeof position !== "number") {
        setIsCurrentCellActive(false);
        return;
      }

      const { from, to } = editor.state.selection;
      const nodeFrom = position;
      const nodeTo = position + node.nodeSize;

      setIsCurrentCellActive(nodeFrom <= from && to <= nodeTo);
    };

    updateCellActivity();
    editor.on("selectionUpdate", updateCellActivity);

    return () => {
      editor.off("selectionUpdate", updateCellActivity);
    };
  }, [editor, getPos, node.nodeSize]);

  const showMenu = (isCurrentCellActive || selected) && editor.isEditable;

  return (
    <NodeViewWrapper className="notion-table-cell">
      {showMenu ? (
        <div className="notion-table-cell-menu" contentEditable={false}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn("notion-table-cell-trigger")}
                onMouseDown={(event) => event.preventDefault()}
                aria-label="Open table actions"
              >
                <ChevronDown className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
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
                  key={action.label}
                  action={action}
                  editor={editor}
                />
              ))}
              <DropdownMenuSeparator className="notion-table-actions-separator" />
              {moveActions.map((action) => (
                <TableActionItem
                  key={action.label}
                  action={action}
                  editor={editor}
                />
              ))}
              <DropdownMenuSeparator className="notion-table-actions-separator" />
              {columnInsertionActions.map((action) => (
                <TableActionItem
                  key={action.label}
                  action={action}
                  editor={editor}
                />
              ))}
              <DropdownMenuSeparator className="notion-table-actions-separator" />
              {insertionActions.map((action) => (
                <TableActionItem
                  key={action.label}
                  action={action}
                  editor={editor}
                />
              ))}
              <DropdownMenuSeparator className="notion-table-actions-separator" />
              {removalActions.map((action) => (
                <TableActionItem
                  key={action.label}
                  action={action}
                  editor={editor}
                />
              ))}
              <DropdownMenuSeparator className="notion-table-actions-separator" />
              {destructiveActions.map((action) => (
                <TableActionItem
                  key={action.label}
                  action={action}
                  editor={editor}
                />
              ))}
            </DropdownMenuContent>
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
