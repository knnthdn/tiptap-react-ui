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
import TableOfContents from "@tiptap/extension-table-of-contents";

//* CUSTOM IMPORTS
import { NotionTableExtensions } from "../components/editor/notion-table";
import "highlight.js/styles/github-dark-dimmed.min.css";

type YoutubeAlignment = "left" | "center" | "right";

//* Full-width flag + horizontal alignment
const YoutubeResponsive = Youtube.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
          default: null,
          parseHTML: (element) => element.getAttribute("width") || element.style.width || null,
          renderHTML: () => ({}),
        },
        height: {
          default: null,
          parseHTML: (element) => element.getAttribute("height") || element.style.height || null,
          renderHTML: () => ({}),
        },
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

const InlineImage = Image.extend({
  name: "inlineImage",
  priority: 1000,

  parseHTML() {
    return [{ tag: "img[data-tiptap-image-inline]" }];
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
          default: null,
          parseHTML: (element) => element.getAttribute("width") || element.style.width || null,
          renderHTML: () => ({}),
        },
        height: {
          default: null,
          parseHTML: (element) => element.getAttribute("height") || element.style.height || null,
          renderHTML: () => ({}),
        },
        alignment: {
        default: "left",
        parseHTML: (element) => {
          const value = element.getAttribute("data-align");
          if (value === "left" || value === "right" || value === "center") {
            return value;
          }
          return "center";
        },
        renderHTML: () => ({}),
      },
      inline: {
        default: true,
        parseHTML: () => true,
        renderHTML: () => ({}),
      },
    };
  },

  renderHTML({ node }) {
    const alignment = node.attrs.alignment || "center";
    const floatStyle =
      alignment === "left"
        ? "float: left; margin: 0 0.75rem 0.25rem 0;"
        : alignment === "right"
          ? "float: right; margin: 0 0 0.25rem 0.75rem;"
          : "margin: 0 0.35rem;";

    return [
      "img",
      {
        src: node.attrs.src,
        alt: node.attrs.alt || "",
        title: node.attrs.title || undefined,
        width: node.attrs.width,
        height: node.attrs.height,
        "data-tiptap-image-inline": "",
        "data-align": alignment,
        style: `max-width: 100%; height: auto; display: inline-block; vertical-align: middle; border-radius: 6px; ${floatStyle}`,
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },
}).configure({
  inline: true,
  resize: {
    enabled: true,
    directions: ["top", "bottom", "left", "right"],
    minWidth: 50,
    minHeight: 50,
    alwaysPreserveAspectRatio: true,
  },
});

export const extensions = [
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
        width: {
          default: null,
          parseHTML: (element) => element.getAttribute("width") || element.style.width || null,
          renderHTML: () => ({}),
        },
        height: {
          default: null,
          parseHTML: (element) => element.getAttribute("height") || element.style.height || null,
          renderHTML: () => ({}),
        },
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
        inline: {
          default: false,
          parseHTML: (element) => {
            return element.hasAttribute("data-tiptap-image-inline");
          },
          renderHTML: () => {
            return {};
          },
        },
      };
    },

    renderHTML({ node }) {
      const alignment = node.attrs.alignment || "center";
      const inline = node.attrs.inline === true || node.attrs.inline === "true";

      const imageAttrs: Record<string, unknown> = {
        src: node.attrs.src,
        alt: node.attrs.alt || "",
        title: node.attrs.title || undefined,
        width: node.attrs.width,
        height: node.attrs.height,
      };

      if (inline) {
        const floatStyle =
          alignment === "right"
            ? "float: right; margin: 0 0 0.25rem 1rem;"
            : "float: left; margin: 0 1rem 0.25rem 0;";

        return [
          "div",
          {
            "data-tiptap-image-wrapper": "",
            "data-tiptap-image-inline": "",
            "data-align": alignment,
            style: `${floatStyle} width: ${imageAttrs.width || "auto"}; max-width: 100%;`,
          },
          [
            "img",
            {
              ...imageAttrs,
              "data-tiptap-image-inline": "",
              style:
                "max-width: 100%; height: auto; display: block; border-radius: 6px",
            },
          ],
        ];
      }

      const blockMargin =
        alignment === "right"
          ? "margin-left: auto; margin-right: 0;"
          : alignment === "center"
            ? "margin-left: auto; margin-right: auto;"
            : "margin-left: 0; margin-right: auto;";

      return [
        "div",
        {
          "data-tiptap-image-wrapper": "",
          "data-align": alignment,
          style: `display: block; width: ${imageAttrs.width || "fit-content"}; max-width: 100%; ${blockMargin}`,
        },
        [
          "img",
          {
            ...imageAttrs,
            style: `${imageAttrs.width ? "width: 100%; " : ""}max-width: 100%; height: auto; display: block; border-radius: 6px`,
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

  //* INLINE IMAGE
  InlineImage,

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
  handleImageUpload,
  tableOfContents,
  className,
  placeholder = "Write something...",
  immediatelyRender = false,
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
          "tiptap text-left text-base focus:outline-0",
          className,
        ),
        spellcheck: "false",
      },
    },

    extensions: [
      ...extensions,
      Placeholder.configure({
        placeholder: ({ editor }) => {
          return editor.isEmpty ? placeholder : "";
        },
      }),
      ...(tableOfContents ? [TableOfContents.configure(tableOfContents)] : []),
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: maxLimit * 1024 * 1024,
        limit: limit,
        upload: onUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],

    immediatelyRender,
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
    isEditorLoading: !editor,
    getEditorContent,
  };
}
