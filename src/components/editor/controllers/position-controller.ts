import { CONSTANTS } from "../constants/index";
import type { ImageElements } from "../types/index";
import { StyleManager } from "../utils/style-manager";

export class PositionController {
  private elements: ImageElements;
  private inline: boolean;
  private dispatchNodeView: () => void;
  private onAlignmentChange: (alignment: "left" | "center" | "right") => void;

  constructor(
    elements: ImageElements,
    inline: boolean,
    dispatchNodeView: () => void,
    onAlignmentChange: (alignment: "left" | "center" | "right") => void,
  ) {
    this.elements = elements;
    this.inline = inline;
    this.dispatchNodeView = dispatchNodeView;
    this.onAlignmentChange = onAlignmentChange;
  }

  private getIconSvg(iconName: string): string {
    const iconMap: Record<string, string> = {
      AlignLeft: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="3" y1="6" y2="6"></line><line x1="15" x2="3" y1="12" y2="12"></line><line x1="17" x2="3" y1="18" y2="18"></line></svg>`,
      AlignCenter: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="3" y1="6" y2="6"></line><line x1="17" x2="7" y1="12" y2="12"></line><line x1="19" x2="5" y1="18" y2="18"></line></svg>`,
      AlignRight: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="3" y1="6" y2="6"></line><line x1="21" x2="9" y1="12" y2="12"></line><line x1="21" x2="7" y1="18" y2="18"></line></svg>`,
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

    // Style the SVG inside
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
    if (!this.inline) {
      this.elements.wrapper.style.justifyContent = "flex-start";
    } else {
      const style = "display: inline-block; float: left; padding-right: 8px;";
      this.elements.wrapper.setAttribute("style", style);
      this.elements.container.setAttribute("style", style);
    }
    this.onAlignmentChange("left");
    this.dispatchNodeView();
  }

  private handleCenterClick(): void {
    this.elements.wrapper.style.justifyContent = "center";
    this.onAlignmentChange("center");
    this.dispatchNodeView();
  }

  private handleRightClick(): void {
    if (!this.inline) {
      this.elements.wrapper.style.justifyContent = "flex-end";
    } else {
      const style = "display: inline-block; float: right; padding-left: 8px;";
      this.elements.wrapper.setAttribute("style", style);
      this.elements.container.setAttribute("style", style);
    }
    this.onAlignmentChange("right");
    this.dispatchNodeView();
  }

  createPositionControls(): PositionController {
    const controller = document.createElement("div");
    controller.setAttribute("data-position-controller", "true");
    controller.setAttribute(
      "style",
      StyleManager.getPositionControllerStyle(this.inline),
    );

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
