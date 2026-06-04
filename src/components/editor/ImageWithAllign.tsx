import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { ResizeController } from "./controllers/resize-controller";
import { PositionController } from "./controllers/position-controller";
import { CONSTANTS } from "./constants";
import { utils } from "./utils";
import type { ImageElements } from "./types";

export default function ImageComponent(props: NodeViewProps) {
  const { src, alt, width, height, alignment } = props.node.attrs;
  const { updateAttributes, editor, getPos } = props;
  const isEditable = editor.isEditable;
  const [showResizeHandles, setShowResizeHandles] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const resizeControllerRef = useRef<ResizeController | null>(null);
  const positionControllerRef = useRef<PositionController | null>(null);

  const dispatchNodeView = () => {
    if (containerRef.current) {
      const newWidth = containerRef.current.style.width;
      if (newWidth) {
        updateAttributes({ width: newWidth });
      }
    }
  };

  const handleAlignmentChange = (alignment: "left" | "center" | "right") => {
    updateAttributes({ alignment });
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
    if (!containerRef.current || !wrapperRef.current || !imgRef.current) return;

    const elements: ImageElements = {
      wrapper: wrapperRef.current,
      container: containerRef.current,
      img: imgRef.current,
    };

    resizeControllerRef.current = new ResizeController(
      elements,
      dispatchNodeView,
    );

    Array.from({ length: 4 }, (_, index) => {
      const dot = resizeControllerRef.current!.createResizeHandle(index);
      containerRef.current!.appendChild(dot);
    });
  };

  const createAlignmentControls = () => {
    if (!containerRef.current || !wrapperRef.current || !imgRef.current) return;

    const elements: ImageElements = {
      wrapper: wrapperRef.current,
      container: containerRef.current,
      img: imgRef.current,
    };

    positionControllerRef.current = new PositionController(
      elements,
      false,
      dispatchNodeView,
      handleAlignmentChange,
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
  const justifyContent =
    alignment === "left"
      ? "flex-start"
      : alignment === "right"
        ? "flex-end"
        : "center";

  const isFirstNode = getPos() === 0;

  return (
    <NodeViewWrapper>
      <div
        ref={wrapperRef}
        className="flex"
        style={{
          width: "100%",
          justifyContent: justifyContent,
          marginTop: isFirstNode ? 0 : 32,
          marginBottom: 32,
        }}
      >
        <div
          ref={containerRef}
          className="relative"
          onClick={handleContainerClick}
          style={{
            width: containerWidth,
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
            className={`rounded-md`}
            style={{
              width: "100%",
              height: height ? `${height}px` : "auto",
              maxWidth: "100%",
              display: "block",
            }}
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
