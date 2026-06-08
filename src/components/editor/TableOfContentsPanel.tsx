import type { TableOfContentDataItem } from "@tiptap/extension-table-of-contents";
import { ListTree } from "lucide-react";
import { cn } from "../../lib/utils";
import { scrollTableOfContentsItemIntoView } from "./utils/scroll-toc-item";

export type TableOfContentsPanelProps = {
  items: TableOfContentDataItem[];
  className?: string;
  position?: "left" | "right";
  style?: React.CSSProperties;
  showActiveState?: boolean;
  onItemClick?: (item: TableOfContentDataItem) => void;
};

export default function TableOfContentsPanel({
  items,
  className,
  position = "right",
  style,
  showActiveState = true,
  onItemClick,
}: TableOfContentsPanelProps) {
  const visibleItems = items.filter((item) => item.textContent.trim().length);

  if (visibleItems.length === 0) return null;

  return (
    <nav
      aria-label="Table of contents"
      className={cn(
        "tr-editor shrink-0 border-b bg-background/95 px-5 pt-5 pb-6 text-sm lg:w-64 lg:border-b-0 lg:py-6",
        position === "left" ? "lg:pr-6" : "lg:pl-6",
        className,
      )}
      style={style}
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
        <ListTree className="size-4" />
        <span>On this page</span>
      </div>

      <ol className="space-y-0.5">
        {visibleItems.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={cn(
                "block min-h-8 w-full truncate px-3 py-1.5 text-left text-sm leading-5 transition-colors",
                "text-muted-foreground hover:text-foreground",
                showActiveState && item.isActive
                  ? "font-medium text-blue-500 dark:text-blue-400"
                  : undefined,
              )}
              style={{
                paddingLeft: `${Math.max(item.level - 1, 0) * 0.75 + 0.75}rem`,
              }}
              title={item.textContent}
              onClick={() => {
                if (onItemClick) {
                  onItemClick(item);
                  return;
                }

                scrollTableOfContentsItemIntoView(item);
              }}
            >
              {item.textContent}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
