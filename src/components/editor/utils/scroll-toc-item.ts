import type { Editor } from "@tiptap/core";
import type { TableOfContentDataItem } from "@tiptap/extension-table-of-contents";

export function scrollTableOfContentsItemIntoView(
  item: TableOfContentDataItem,
  editor: Editor = item.editor,
) {
  const editorElement = editor.view.dom;
  const nodeElement = editor.view.nodeDOM(item.pos);
  const target =
    (nodeElement instanceof HTMLElement ? nodeElement : null) ??
    Array.from(editorElement.querySelectorAll<HTMLElement>("[data-toc-id]")).find(
      (element) => element.getAttribute("data-toc-id") === item.id,
    ) ??
    item.dom;

  if (!target) return;

  const scrollParent = findScrollableParent(target) ?? editorElement;

  if (scrollParent instanceof Window) {
    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    return;
  }

  const parentRect = scrollParent.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  scrollParent.scrollTo({
    behavior: "smooth",
    top: Math.max(targetRect.top - parentRect.top + scrollParent.scrollTop - 16, 0),
  });
}

function findScrollableParent(element: HTMLElement): HTMLElement | Window | null {
  let current: HTMLElement | null = element;

  while (current) {
    const style = window.getComputedStyle(current);
    const canScrollY = /(auto|scroll|overlay)/.test(style.overflowY);

    if (canScrollY && current.scrollHeight > current.clientHeight) {
      return current;
    }

    current = current.parentElement;
  }

  return window;
}
