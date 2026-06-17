import { CONSTANTS } from "../constants/index";
import type { ImageElements } from "../types/index";
import { StyleManager } from "../utils/style-manager";

type ImageAlignment = "left" | "center" | "right";

export class PositionController {
  private elements: ImageElements;
  private inline: boolean;
  private dispatchNodeView: () => void;
  private onAlignmentChange: (alignment: ImageAlignment) => void;
  private onInlineChange: (inline: boolean) => void;

  constructor(
    elements: ImageElements,
    inline: boolean,
    dispatchNodeView: () => void,
    onAlignmentChange: (alignment: ImageAlignment) => void,
    onInlineChange: (inline: boolean) => void = () => {},
  ) {
    this.elements = elements;
    this.inline = inline;
    this.dispatchNodeView = dispatchNodeView;
    this.onAlignmentChange = onAlignmentChange;
    this.onInlineChange = onInlineChange;
  }

  private getIconSvg(iconName: string): string {
    const iconMap: Record<string, string> = {
      AlignLeft: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="3" y1="6" y2="6"></line><line x1="15" x2="3" y1="12" y2="12"></line><line x1="17" x2="3" y1="18" y2="18"></line></svg>`,
      AlignCenter: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="3" y1="6" y2="6"></line><line x1="17" x2="7" y1="12" y2="12"></line><line x1="19" x2="5" y1="18" y2="18"></line></svg>`,
      AlignRight: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="3" y1="6" y2="6"></line><line x1="21" x2="9" y1="12" y2="12"></line><line x1="21" x2="7" y1="18" y2="18"></line></svg>`,
      InlineImage: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="8" height="8" rx="1.5"></rect><path d="M3 6h3"></path><path d="M18 6h3"></path><path d="M3 12h3"></path><path d="M18 12h3"></path><path d="M3 18h3"></path><path d="M18 18h3"></path></svg>`,
    };
    return iconMap[iconName] || "";
  }

  private createControllerIcon(iconName: string, tooltip: string): HTMLElement {
    const container = document.createElement("div");
    container.innerHTML = this.getIconSvg(iconName);
    container.setAttribute("title", tooltip);
    container.setAttribute(
      "style",
      `width: ${CONSTANTS.ICON_SIZE}; height: ${CONSTANTS.ICON_SIZE}; cursor: pointer; opacity: 0.7; transition: opacity 0.2s; display: flex; align-items: center; justify-content: center; position: relative; color: ${CONSTANTS.COLORS.BORDER};`,
    );

    const svg = container.querySelector("svg");
    if (svg) {
      svg.setAttribute("width", CONSTANTS.ICON_SIZE);
      svg.setAttribute("height", CONSTANTS.ICON_SIZE);
    }

    container.addEventListener("mouseover", (e) => {
      (e.currentTarget as HTMLElement).style.opacity = "1";
    });

    container.addEventListener("mouseout", (e) => {
      (e.currentTarget as HTMLElement).style.opacity = "0.7";
    });

    return container;
  }

  private handleLeftClick(): void {
    this.onAlignmentChange("left");
    this.dispatchNodeView();
  }

  private handleCenterClick(): void {
    this.onAlignmentChange("center");
    this.dispatchNodeView();
  }

  private handleRightClick(): void {
    this.onAlignmentChange("right");
    this.dispatchNodeView();
  }

  private handleInlineToggle(): void {
    this.onInlineChange(!this.inline);
  }

  createPositionControls(): PositionController {
    const controller = document.createElement("div");
    controller.setAttribute("data-position-controller", "true");
    controller.setAttribute(
      "style",
      StyleManager.getPositionControllerStyle(this.inline),
    );

    const inlineController = this.createControllerIcon(
      "InlineImage",
      this.inline ? "Use block image" : "Use inline image",
    );
    inlineController.addEventListener("click", () => this.handleInlineToggle());
    controller.appendChild(inlineController);

    const leftController = this.createControllerIcon(
      CONSTANTS.ICONS.LEFT,
      "Align Left",
    );
    leftController.addEventListener("click", () => this.handleLeftClick());
    controller.appendChild(leftController);

    if (!this.inline) {
      const centerController = this.createControllerIcon(
        CONSTANTS.ICONS.CENTER,
        "Align Center",
      );
      centerController.addEventListener("click", () =>
        this.handleCenterClick(),
      );
      controller.appendChild(centerController);
    }

    const rightController = this.createControllerIcon(
      CONSTANTS.ICONS.RIGHT,
      "Align Right",
    );
    rightController.addEventListener("click", () => this.handleRightClick());
    controller.appendChild(rightController);

    this.elements.container.appendChild(controller);
    return this;
  }

  removePositionControls(): void {
    const existingController = this.elements.container.querySelector(
      '[data-position-controller="true"]',
    );
    if (existingController) {
      this.elements.container.removeChild(existingController);
    }
  }
}