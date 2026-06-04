import "./index.css";

import RichTextEditor from "./components/editor/Tiptap";

import useTiptapEditor from "./hooks/useTiptapEditor";

import RenderJSON from "./components/editor/RenderJSONPreview";

import RenderHTML from "./components/editor/RenderHTMLPreview";

import type { OnSaveArgs } from "./components/editor/types/editors";

export { RichTextEditor, useTiptapEditor, RenderJSON, RenderHTML };

export type { OnSaveArgs };
