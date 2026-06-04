"use client";

import type { Editor } from "@tiptap/core";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
  createTable,
} from "@tiptap/extension-table";
import { TextSelection } from "@tiptap/pm/state";

import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";

import { ChevronDown, Minus, Plus, Table2, Trash2 } from "lucide-react";
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
  icon: typeof Plus;
  run: (editor: Editor) => boolean;
  destructive?: boolean;
};

const insertionActions: TableAction[] = [
  {
    label: "Add row above",
    icon: Plus,
    run: (editor) => editor.chain().focus().addRowBefore().run(),
  },
  {
    label: "Add row below",
    icon: Plus,
    run: (editor) => editor.chain().focus().addRowAfter().run(),
  },
  {
    label: "Add column before",
    icon: Plus,
    run: (editor) => editor.chain().focus().addColumnBefore().run(),
  },
  {
    label: "Add column after",
    icon: Plus,
    run: (editor) => editor.chain().focus().addColumnAfter().run(),
  },
];

const removalActions: TableAction[] = [
  {
    label: "Remove row",
    icon: Minus,
    run: (editor) => editor.chain().focus().deleteRow().run(),
  },
  {
    label: "Remove column",
    icon: Minus,
    run: (editor) => editor.chain().focus().deleteColumn().run(),
  },
];

const headerActions: TableAction[] = [
  {
    label: "Toggle header row",
    icon: Table2,
    run: (editor) => editor.chain().focus().toggleHeaderRow().run(),
  },
  {
    label: "Toggle header column",
    icon: Table2,
    run: (editor) => editor.chain().focus().toggleHeaderColumn().run(),
  },
  {
    label: "Toggle header cell",
    icon: Table2,
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
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Table actions</DropdownMenuLabel>
              {insertionActions.map((action) => (
                <TableActionItem
                  key={action.label}
                  action={action}
                  editor={editor}
                />
              ))}
              <DropdownMenuSeparator />
              {removalActions.map((action) => (
                <TableActionItem
                  key={action.label}
                  action={action}
                  editor={editor}
                />
              ))}
              <DropdownMenuSeparator />
              {headerActions.map((action) => (
                <TableActionItem
                  key={action.label}
                  action={action}
                  editor={editor}
                />
              ))}
              <DropdownMenuSeparator />
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
