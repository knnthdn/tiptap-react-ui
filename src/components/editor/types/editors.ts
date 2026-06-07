import { Editor, HTMLContent, JSONContent } from "@tiptap/core";
import { UseEditorOptions } from "@tiptap/react";

//* useTiptapEditor hooks
/**
 * Configuration options for the underlying Tiptap editor instance.
 *
 * These options are passed directly to `useEditor` and control
 * the core behavior, lifecycle, and plugin system of the editor.
 *
 * Includes support for:
 * - lifecycle hooks (onCreate, onUpdate, etc.)
 * - input/paste rules
 * - core extensions
 * - rendering and mounting behavior
 * - ProseMirror configuration
 */
type TiptapOptions = Pick<
  UseEditorOptions,
  | "autofocus"
  | "content"
  | "coreExtensionOptions"
  | "editable"
  | "element"
  | "emitContentError"
  | "enableContentCheck"
  | "enableCoreExtensions"
  | "enableExtensionDispatchTransaction"
  | "enableInputRules"
  | "enablePasteRules"
  | "immediatelyRender"
  | "injectCSS"
  | "injectNonce"
  | "onBeforeCreate"
  | "onBlur"
  | "onContentError"
  | "onCreate"
  | "onDelete"
  | "onDestroy"
  | "onDrop"
  | "onFocus"
  | "onMount"
  | "onPaste"
  | "onSelectionUpdate"
  | "onTransaction"
  | "onUnmount"
  | "onUpdate"
  | "parseOptions"
  | "shouldRerenderOnTransaction"
  | "textDirection"
  | "editorProps"
>;

/**
 * Props for the Tiptap editor React component.
 *
 * Extends all underlying Tiptap configuration options and adds
 * UI-level behavior controls for the wrapper component.
 */
export type TiptapEditorProps = {
  /**
   * Enables preview mode for the editor UI.
   *
   * When true:
   * - Editor padding is removed for better preview layout
   * - Editor is styled as read-only preview surface
   *
   * @default false
   */
  isPreview?: boolean;

  handleImageUpload?: {
    onUpload?: (
      file: File,
      onProgress?: (event: { progress: number }) => void,
      abortSignal?: AbortSignal,
    ) => Promise<string>;
    maxLimit?: number;
    limit?: number;
  };

  /**
   * Class applied to the ProseMirror editor element.
   *
   * Default behavior:
   * - `max-h-[60vh]` limits editor height to 60% of the viewport
   * - `overflow-y-auto` enables scrolling for long content
   *
   * In non-preview mode, padding and border styles are applied.
   * `className` can extend or override default styles.
   */
  className?: string;
} & TiptapOptions;

export type OnSaveArgs = {
  json: JSONContent;
  html: string;
};

export const RICH_TEXT_EDITOR_THEMES = [
  "default",
  "pink",
  "rose",
  "violet",
  "blue",
  "emerald",
  "amber",
  "github",
] as const;

export type RichTextEditorTheme = (typeof RICH_TEXT_EDITOR_THEMES)[number];

export type RichTextEditorMode = "light" | "dark" | "system";

//* useTiptapEditor hooks return types

export type TiptapEditorReturnTypes = {
  /**
   * Tiptap editor instance returned from `useEditor`.
   *
   * Can be `null` during initial mount.
   */
  editor: Editor;

  /**
   * Returns the current editor content as both
   * Tiptap JSON and serialized HTML.
   *
   * @returns Object containing:
   * - `json`: Tiptap JSON document
   * - `html`: Serialized HTML output
   *
   * @example const {json,html} = getEditorContent()
   */
  getEditorContent: () => {
    json: JSONContent | null;
    html: string | null;
  };
};

//* RichTextEditor Component
export type RichTextEditorProps = {
  /**
   * Instance of Tiptap Editor from useTiptapEditor
   */
  editor: Editor;

  /**
   * Callback triggered when the save button is clicked.
   *
   * When provided:
   * - A save button will automatically appear in the editor menubar.
   * - The current editor content will be returned as both JSON and HTML.
   *
   * @param val Editor content payload.
   * @param val.json Tiptap JSON document content.
   * @param val.html TIptap HTML output.
   */
  onSave?: (val: OnSaveArgs) => void;

  /**
   * Editors content generated preview (JSON and HTML format)
   * @default false
   */
  enablePreview?: boolean;

  /**
   * Enables the editor word count and character count display.
   *
   * When enabled, the editor footer will show:
   * - Total words
   * - Total characters
   *
   * @default true
   */
  enableWordCount?: boolean;

  /**
   * Controls whether the preview should render immediately.
   *
   * In SSR environments like Next.js, if `enablePreview`
   * is enabled, setting this to `false` can help prevent
   * hydration mismatch issues during initial render.
   *
   * @default true
   */
  immediatelyRenderPreview?: boolean;

  /**
   * Shows a theme mode toggle in the editor header.
   *
   * When true, users can switch the theme mode between
   * light, dark, and system.
   *
   * It only scope to the editor.
   *
   *
   * @default false
   *
   */
  enableModeToggle?: boolean;

  /**
   * Initial theme mode used by the editor.
   *
   * Use `light`, `dark`, or `system`. When `enableModeToggle`
   * is true, users can switch this mode from the editor header.
   *
   * @default "light"
   */
  mode?: RichTextEditorMode;

  /**
   * Built-in visual theme applied to the editor.
   *
   * Popular choices include:
   * - `pink`
   * - `rose`
   * - `violet`
   * - `blue`
   * - `emerald`
   * - `amber`
   * - `github`
   *
   * @default "default"
   */
  theme?: RichTextEditorTheme;

  /**
   * Custom class names applied to the editor's container wrapper.
   *
   * Useful for:
   * - Custom styling
   * - Layout adjustments
   * - Tailwind utility classes
   * - Margins outside editor
   * - Positioning
   */
  className?: string;
};

//* RenderJSON Component

/**
 * Props for `RenderJSON`.
 *
 * `RenderJSON` renders a saved Tiptap JSON document in a read-only editor
 * surface. Use it when your stored source of truth is `editor.getJSON()`.
 */
export type RenderJSONProps = {
  /**
   * Tiptap JSON document generated from `editor.getJSON()`.
   *
   * This represents the structured editor state and is used as the
   * source of truth for rendering content.
   */
  content: JSONContent;

  /**
   * Controls whether the content should be rendered immediately.
   *
   * Useful for SSR environments (e.g. Next.js) to prevent hydration
   * mismatch or to delay rendering until client-side mount.
   *
   * @default true
   */
  immediatelyRender?: boolean;

  /**
   * Custom class names applied to the rendered output container.
   *
   * Useful for styling:
   * - typography (e.g. Tailwind `prose`)
   * - layout adjustments
   * - theming (dark/light mode)
   */
  contentClassName?: string;

  /**
   * Theme mode applied to the rendered output.
   *
   * Use `dark` when rendering editor-generated content on a dark surface.
   * Use `system` to inherit from a global dark-mode scope.
   *
   * @default "system"
   */
  mode?: RichTextEditorMode;

  /**
   * Custom class names applied to the editable Tiptap editor element.
   *
   * Useful for styling:
   * - editor height/scroll behavior
   * - padding and spacing
   * - typography
   * - borders and focus states
   *
   * Can extend or override the default editor styles.
   */
  editorsClassName?: string;

  /**
   * Optional fixed editor height in pixels.
   *
   * @internal
   */
  _height?: number;
};

//* RenderHTML Component
/**
 * Props for `RenderHTML`.
 *
 * `RenderHTML` renders serialized HTML generated by `editor.getHTML()`.
 * It is intentionally raw by default so consumers control padding,
 * typography, width, and scrolling through `className`.
 */
export type RenderHTMLProps = {
  /**
   * HTML string generated from `editor.getHTML()`.
   *
   * This is the serialized output of the Tiptap editor and represents
   * the final rendered document structure.
   */
  content: HTMLContent;

  /**
   * Custom class names applied to the wrapper element.
   *
   * Useful for styling:
   * - typography systems (e.g. Tailwind `prose`)
   * - layout control
   * - theme-based styling
   */
  className?: string;

  /**
   * Theme mode applied to the rendered output.
   *
   * Use `dark` when rendering editor-generated content on a dark surface.
   * Use `system` to inherit from a global dark-mode scope.
   *
   * @default "system"
   */
  mode?: RichTextEditorMode;

  /**
   * Optional HTML sanitization function.
   *
   * Useful for:
   * - preventing XSS when rendering user-generated content
   * - stripping unsafe tags (script, iframe, etc.)
   * - preparing HTML for email clients or CMS output
   *
   * @param html Raw HTML string from Tiptap
   * @returns Sanitized safe HTML string
   *
   * @example
   * sanitize={(html) => DOMPurify.sanitize(html)}
   */
  sanitize?: (html: string) => string;
};
