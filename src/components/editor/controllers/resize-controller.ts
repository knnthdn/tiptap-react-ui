import { ImageElements, ResizeState } from "../types/index";
import { StyleManager } from "../utils/style-manager";

export class ResizeController {
  private elements: ImageElements;
  private dispatchNodeView: () => void;
  private inline: boolean;
  private state: ResizeState = {
    isResizing: false,
    startX: 0,
    startWidth: 0,
  };

  constructor(
    elements: ImageElements,
    dispatchNodeView: () => void,
    inline = false,
  ) {
    this.elements = elements;
    this.dispatchNodeView = dispatchNodeView;
    this.inline = inline;
  }

  private applyWidth(newWidth: number): void {
    if (this.inline) {
      const maxWidth =
        this.elements.wrapper.closest(".ProseMirror")?.clientWidth ||
        this.elements.wrapper.parentElement?.clientWidth ||
        this.elements.wrapper.offsetWidth;
      const clampedWidth = Math.min(Math.max(newWidth, 50), maxWidth);

      this.elements.container.style.width = `${clampedWidth}px`;
      this.elements.img.style.width = "100%";
      return;
    }

    const availableWidth =
      this.elements.wrapper.closest(".ProseMirror")?.clientWidth ||
      this.elements.wrapper.parentElement?.clientWidth ||
      this.elements.wrapper.offsetWidth;
    let percentageWidth = (newWidth / availableWidth) * 100;
    percentageWidth = percentageWidth > 100 ? 100 : percentageWidth;
    percentageWidth = percentageWidth < 10 ? 10 : percentageWidth;

    this.elements.wrapper.style.width = percentageWidth + "%";
    this.elements.container.style.width = "100%";
    this.elements.img.style.width = "100%";
  }

  private handleMouseMove = (e: MouseEvent, index: number): void => {
    if (!this.state.isResizing) return;

    const deltaX =
      index % 2 === 0
        ? -(e.clientX - this.state.startX)
        : e.clientX - this.state.startX;
    const newWidth = this.state.startWidth + deltaX;

    this.applyWidth(newWidth);
  };

  private handleMouseUp = (): void => {
    if (this.state.isResizing) {
      this.state.isResizing = false;
    }
    this.dispatchNodeView();
  };

  private handleTouchMove = (e: TouchEvent, index: number): void => {
    if (!this.state.isResizing) return;

    const deltaX =
      index % 2 === 0
        ? -(e.touches[0].clientX - this.state.startX)
        : e.touches[0].clientX - this.state.startX;
    const newWidth = this.state.startWidth + deltaX;

    this.applyWidth(newWidth);
  };

  private handleTouchEnd = (): void => {
    if (this.state.isResizing) {
      this.state.isResizing = false;
    }
    this.dispatchNodeView();
  };

  createResizeHandle(index: number): HTMLElement {
    const dot = document.createElement("div");
    dot.setAttribute("data-resize-dot", "true");
    dot.setAttribute("style", StyleManager.getDotStyle(index));

    dot.addEventListener("mousedown", (e) => {
      e.preventDefault();
      this.state.isResizing = true;
      this.state.startX = e.clientX;
      this.state.startWidth = this.elements.container.offsetWidth;

      const onMouseMove = (e: MouseEvent) => this.handleMouseMove(e, index);
      const onMouseUp = () => {
        this.handleMouseUp();
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    dot.addEventListener(
      "touchstart",
      (e) => {
        e.cancelable && e.preventDefault();
        this.state.isResizing = true;
        this.state.startX = e.touches[0].clientX;
        this.state.startWidth = this.elements.container.offsetWidth;

        const onTouchMove = (e: TouchEvent) => this.handleTouchMove(e, index);
        const onTouchEnd = () => {
          this.handleTouchEnd();
          document.removeEventListener("touchmove", onTouchMove);
          document.removeEventListener("touchend", onTouchEnd);
        };

        document.addEventListener("touchmove", onTouchMove);
        document.addEventListener("touchend", onTouchEnd);
      },
      { passive: false },
    );

    return dot;
  }
}