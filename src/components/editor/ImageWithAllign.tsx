import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ResizeController } from "./controllers/resize-controller";
import { PositionController } from "./controllers/position-controller";
import { CONSTANTS } from "./constants";
import { utils } from "./utils";
import type { ImageElements } from "./types";

type ImageAlignment = "left" | "center" | "right";


export default function ImageComponent(props: NodeViewProps) {
  const { src, alt, width, height, alignment } = props.node.attrs;
  const { updateAttributes, editor, node } = props;
  const isEditable = editor.isEditable;
  const isInline = node.attrs.inline === true || node.attrs.inline === "true" || node.type.name === "inlineImage";
  const [showResizeHandles, setShowResizeHandles] = useState(false);
  const nodeWrapperRef = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const resizeControllerRef = useRef<ResizeController | null>(null);
  const positionControllerRef = useRef<PositionController | null>(null);

  const dispatchNodeView = () => {
    const widthTarget = isInline ? containerRef.current : nodeWrapperRef.current;
    const newWidth = widthTarget?.style.width;
    if (newWidth) {
      updateAttributes({ width: newWidth });
    }
  };

  const handleAlignmentChange = (alignment: ImageAlignment) => {
    updateAttributes({ alignment });
  };

  const getRenderedImageWidth = () => {
    const measuredWidth =
      imgRef.current?.getBoundingClientRect().width ||
      containerRef.current?.getBoundingClientRect().width ||
      nodeWrapperRef.current?.getBoundingClientRect().width;

    return measuredWidth && Number.isFinite(measuredWidth)
      ? `${Math.round(measuredWidth)}px`
      : undefined;
  };

  const handleInlineChange = (inline: boolean) => {
    const attrs: { inline: boolean; alignment: ImageAlignment; width?: string } = {
      inline,
      alignment: inline ? "left" : "center",
    };

    if (inline && !isInline) {
      const renderedWidth = getRenderedImageWidth();
      if (renderedWidth) {
        attrs.width = renderedWidth;
      }
    }

    updateAttributes(attrs);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!isEditable) return;
    e.stopPropagation();
    if (!showResizeHandles) {
      setShowResizeHandles(true);
      createResizeHandles();
      createAlignmentControls();
    }
  };

  const createResizeHandles = () => {
    if (!containerRef.current || !nodeWrapperRef.current || !imgRef.current) return;

    const elements: ImageElements = {
      wrapper: nodeWrapperRef.current,
      container: containerRef.current,
      img: imgRef.current,
    };

    resizeControllerRef.current = new ResizeController(
      elements,
      dispatchNodeView,
      isInline,
    );

    Array.from({ length: 4 }, (_, index) => {
      const dot = resizeControllerRef.current!.createResizeHandle(index);
      containerRef.current!.appendChild(dot);
    });
  };

  const createAlignmentControls = () => {
    if (!containerRef.current || !nodeWrapperRef.current || !imgRef.current) return;

    const elements: ImageElements = {
      wrapper: nodeWrapperRef.current,
      container: containerRef.current,
      img: imgRef.current,
    };

    positionControllerRef.current = new PositionController(
      elements,
      isInline,
      dispatchNodeView,
      handleAlignmentChange,
      handleInlineChange,
    );
    positionControllerRef.current.createPositionControls();
  };

  const removeResizeHandles = () => {
    if (containerRef.current) {
      utils.removeResizeElements(containerRef.current);
      utils.clearContainerBorder(containerRef.current);
    }
    setShowResizeHandles(false);
  };

  const removeAlignmentControls = () => {
    if (positionControllerRef.current && containerRef.current) {
      positionControllerRef.current.removePositionControls();
    }
  };

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (containerRef.current && !containerRef.current.contains(target)) {
        removeResizeHandles();
        removeAlignmentControls();
      }
    };

    if (showResizeHandles) {
      document.addEventListener("click", handleDocumentClick);
      return () => {
        document.removeEventListener("click", handleDocumentClick);
      };
    }
  }, [showResizeHandles]);

  useEffect(() => {
    if (!isEditable && showResizeHandles) {
      setTimeout(() => {
        removeResizeHandles();
        removeAlignmentControls();
      }, 0);
    }
  }, [isEditable, showResizeHandles]);

  const containerWidth = width || "auto";
  const hasExplicitWidth = containerWidth !== "auto";
  const resolvedAlignment = (alignment || (isInline ? "left" : "center")) as ImageAlignment;

  const inlineFloatStyle: CSSProperties =
    resolvedAlignment === "left"
      ? { float: "left", margin: "0 0.75rem 0.25rem 0" }
      : resolvedAlignment === "right"
        ? { float: "right", margin: "0 0 0.25rem 0.75rem" }
        : { margin: "0 0.35rem" };
  const blockWrapperStyle: CSSProperties = {
    display: "block",
    width: hasExplicitWidth ? containerWidth : "fit-content",
    maxWidth: "100%",
    marginTop: 0,
    marginBottom: 32,
    marginLeft:
      resolvedAlignment === "center" || resolvedAlignment === "right"
        ? "auto"
        : 0,
    marginRight:
      resolvedAlignment === "center" || resolvedAlignment === "left"
        ? "auto"
        : 0,
  };
  const wrapperStyle: CSSProperties = isInline
    ? {
        display: "inline-block",
        width: "auto",
        verticalAlign: "middle",
        ...inlineFloatStyle,
      }
    : blockWrapperStyle;
  const innerWrapperStyle: CSSProperties = isInline
    ? {
        display: "inline-block",
        width: "auto",
        verticalAlign: "middle",
      }
    : {
        display: "block",
        width: "100%",
        maxWidth: "100%",
      };
  const WrapperElement = isInline ? "span" : "div";
  const ContainerElement = isInline ? "span" : "div";

  return (
    <NodeViewWrapper
      as="div"
      data-tiptap-image-wrapper=""
      data-tiptap-image-inline={isInline ? "" : undefined}
      data-align={resolvedAlignment}
      ref={(element: HTMLElement | null) => { nodeWrapperRef.current = element; }}
      style={wrapperStyle}
    >
      <WrapperElement
        ref={(element) => { wrapperRef.current = element; }}
        className={isInline ? "inline-block" : "flex"}
        style={innerWrapperStyle}
      >
        <ContainerElement
          ref={(element) => { containerRef.current = element; }}
          className="relative"
          onClick={handleContainerClick}
          style={{
            width: isInline || !hasExplicitWidth ? containerWidth : "100%",
            display: isInline ? "inline-block" : undefined,
            cursor: isEditable ? "pointer" : "default",
            border: showResizeHandles
              ? `1px dashed ${CONSTANTS.COLORS.BORDER}`
              : "none",
          }}
        >
          <img
            ref={imgRef}
            src={src}
            alt={alt || ""}
            className="rounded-md"
            style={{
              width: containerWidth === "auto" ? "auto" : "100%",
              height: height ? `${height}px` : "auto",
              maxWidth: "100%",
              display: isInline ? "inline-block" : "block",
              verticalAlign: isInline ? "middle" : undefined,
            }}
          />
        </ContainerElement>
      </WrapperElement>
    </NodeViewWrapper>
  );
}