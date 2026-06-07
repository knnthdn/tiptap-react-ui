import { ReactNodeViewRenderer, useEditor } from "@tiptap/react";

//* NODES
import Highlight from "@tiptap/extension-highlight";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { CodeInlineLowlight } from "../components/editor/CodeInlineHighlight";
import CodeBlockComponent from "../components/editor/CodeBlockComponent";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import Youtube from "@tiptap/extension-youtube";
import Image from "@tiptap/extension-image";

//* CUSTOM IMPORTS
import { NotionTableExtensions } from "../components/editor/notion-table";
import "highlight.js/styles/github-dark-dimmed.min.css";

type YoutubeAlignment = "left" | "center" | "right";

//* Full-width flag + horizontal alignment
const YoutubeResponsive = Youtube.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: {
        default: "center",
        parseHTML: (element) => {
          const div = element.closest?.("[data-youtube-video]");
          const v = div?.getAttribute("data-align");
          if (v === "left" || v === "right" || v === "center") return v;
          return "center";
        },
        renderHTML: () => ({}),
      },
    };
  },

  renderHTML({ HTMLAttributes, node }) {
    const renderParent = this.parent;
    if (!renderParent) {
      return ["div", { "data-youtube-video": "" }, ["iframe", {}]];
    }
    const result = renderParent.call(this, { HTMLAttributes, node }) as [
      string,
      Record<string, unknown>,
      unknown,
    ];
    if (result[0] !== "div") return result;

    const align = (node.attrs.alignment as YoutubeAlignment) ?? "center";
    const width = HTMLAttributes.width ?? node.attrs.width;
    const height = HTMLAttributes.height ?? node.attrs.height;
    const fullWidth = String(width) === "100%";

    const baseDiv =
      typeof result[1] === "object" &&
      result[1] !== null &&
      !Array.isArray(result[1])
        ? { ...result[1] }
        : { "data-youtube-video": "" };

    const divAttrs: Record<string, unknown> = {
      ...baseDiv,
      "data-align": align,
      ...(fullWidth ? { "data-full-width": "" } : {}),
    };

    // For non-full-width videos, apply explicit width/height to the iframe
    // For full-width videos, the CSS handles sizing with aspect-ratio
    const iframeAttrs: Record<string, unknown> = {};
    if (!fullWidth && width) {
      iframeAttrs.width = width;
    }
    if (!fullWidth && height) {
      iframeAttrs.height = height;
    }

    // Preserve any existing iframe attributes from the parent render
    let finalIframeAttrs = iframeAttrs;
    if (Array.isArray(result[2]) && result[2].length > 0) {
      const existingIframe = result[2] as [
        string,
        Record<string, unknown>,
        ...unknown[],
      ];
      if (
        existingIframe[0] === "iframe" &&
        typeof existingIframe[1] === "object" &&
        existingIframe[1] !== null
      ) {
        finalIframeAttrs = { ...existingIframe[1], ...iframeAttrs };
      }
    }

    return [result[0], divAttrs, ["iframe", finalIframeAttrs]];
  },
});

//* HIGHLIGHT.JS
import { all, createLowlight } from "lowlight";

import "highlight.js/styles/github-dark-dimmed.min.css";
import ImageComponent from "../components/editor/ImageWithAllign";
import {
  TiptapEditorProps,
  TiptapEditorReturnTypes,
} from "../components/editor/types/editors";
import { cn, handleImageUploadFallback } from "../lib/utils";
import { ImageUploadNode } from "../components/image-upload-node";

const lowlight = createLowlight(all);

export const extensions = [
  //* PLACEHOLDER
  Placeholder.configure({
    placeholder: ({ editor }) => {
      return editor.isEmpty ? "Write something..." : "";
    },
  }),

  //* STARTERKIT
  StarterKit.configure({
    codeBlock: false,

    heading: {
      levels: [1, 2, 3, 4, 5, 6],
    },
    code: {
      HTMLAttributes: {
        class: "bg-[#2e2b29] p-1 text-white border border-white/10  rounded",
      },
    },
    blockquote: {
      HTMLAttributes: {
        class:
          "rounded-md border-l-4 border-border bg-muted/60 px-4 py-3 italic text-foreground my-6",
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal pl-6 my-6",
      },
    },
    bulletList: {
      keepAttributes: true,
      HTMLAttributes: {
        class: "list-disc pl-6 my-6",
      },
    },
    link: false,
  }),

  //* LINK
  Link.configure({
    HTMLAttributes: {
      class: "text-blue-500 cursor-pointer hover:underline",
    },
    openOnClick: true,
    autolink: false,
    defaultProtocol: "https",
    shouldAutoLink: () => false,
  }),

  //* CODEBLOCK
  CodeBlockLowlight.extend({
    renderHTML({ HTMLAttributes }) {
      return [
        "pre",
        {
          ...HTMLAttributes,
          style:
            "background-color: #2e2b29; border-radius: 0.375rem; padding: 1rem; overflow-x: auto; margin: 1rem 0;",
        },
        ["code", { HTMLAttributes }, 0],
      ];
    },
    addNodeView() {
      return ReactNodeViewRenderer(CodeBlockComponent);
    },
  }).configure({
    lowlight,
    enableTabIndentation: true,
    tabSize: 4,
  }),

  //* INLINE CODEBLOCK
  CodeInlineLowlight.configure({
    lowlight,
  }),

  //* HIGHLIGHT
  Highlight.configure({
    multicolor: true,
    HTMLAttributes: {
      class: "px-1 py-0.5 rounded-xs ",
    },
  }),

  //* TEXTSTYLE KIT
  TextStyleKit,

  //* TEXTALIGN
  TextAlign.configure({
    types: ["heading", "paragraph", "taskItem"],
  }),

  //* TASKLIST
  TaskList.configure({
    HTMLAttributes: {
      class: "tiptap-task-list",
    },
  }),

  TaskItem.configure({
    nested: true,
    HTMLAttributes: {
      class: "tiptap-task-item",
    },
  }),

  //* TABLE
  ...NotionTableExtensions,

  //* IMAGE
  Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        alignment: {
          default: "center",
          parseHTML: (element) => {
            const wrapper = element.closest?.(
              "div[style*='justify-content']",
            ) as HTMLElement | null;
            if (wrapper?.style.justifyContent === "flex-start") return "left";
            if (wrapper?.style.justifyContent === "flex-end") return "right";
            return "center";
          },
          renderHTML: () => {
            return {};
          },
        },
      };
    },

    renderHTML({ node }) {
      const alignment = node.attrs.alignment || "center";
      const justifyContent =
        alignment === "left"
          ? "flex-start"
          : alignment === "right"
            ? "flex-end"
            : "center";

      return [
        "div",
        {
          "data-tiptap-image-wrapper": "",
          style: `display: flex; justify-content: ${justifyContent}; width: 100%;`,
        },
        [
          "img",
          {
            src: node.attrs.src,
            alt: node.attrs.alt || "",
            width: node.attrs.width,
            height: node.attrs.height,
            style:
              "max-width: 100%; height: auto; display: block; border-radius: 6px",
          },
        ],
      ];
    },

    addNodeView() {
      return ReactNodeViewRenderer(ImageComponent);
    },
  }).configure({
    resize: {
      enabled: true,
      directions: ["top", "bottom", "left", "right"],
      minWidth: 50,
      minHeight: 50,
      alwaysPreserveAspectRatio: true,
    },
  }),

  //* YOUTUBE
  YoutubeResponsive.configure({
    HTMLAttributes: {
      class: "rounded-md ",
    },
  }),

  //* WORD COUNT
  CharacterCount,
];

/**
 * Initializes a Tiptap editor instance with shared extensions
 * and helper utilities for retrieving editor content.
 *
 * @param options Tiptap editor configuration options.
 *
 * @returns Editor instance and content helpers.
 */
export default function useTiptapEditor({
  isPreview = false,
  handleImageUpload,
  className,
  ...options
}: TiptapEditorProps = {}): TiptapEditorReturnTypes {
  const {
    onUpload = handleImageUploadFallback,
    maxLimit = 5,
    limit = 3,
  } = handleImageUpload ?? {};

  const editor = useEditor({
    editorProps: {
      attributes: {
        class: cn(
          "tiptap text-left text-base min-h-50 max-h-[60vh] overflow-y-auto",
          !isPreview && "px-6 py-8 border focus:outline-0",
          className,
        ),
        spellcheck: "false",
      },
    },

    extensions: [
      ...extensions,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: maxLimit * 1024 * 1024,
        limit: limit,
        upload: onUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],

    ...options,
  });

  function getEditorContent() {
    if (!editor) {
      return {
        json: null,
        html: null,
      };
    }

    return {
      json: editor.getJSON(),
      html: editor.getHTML(),
    };
  }

  return {
    editor,
    getEditorContent,
  };
}
