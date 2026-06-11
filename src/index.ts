import "./index.css";

import RichTextEditor from "./components/editor/Tiptap";

import NotionEditor from "./components/editor/NotionEditor";

import useTiptapEditor from "./hooks/useTiptapEditor";

import RenderJSON from "./components/editor/RenderJSON";

import RenderHTML from "./components/editor/RenderHTML";

import type { OnSaveArgs } from "./components/editor/types/editors";
import { RICH_TEXT_EDITOR_THEMES } from "./components/editor/types/editors";
import type {
  NotionEditorProps,
  RichTextEditorMode,
  RichTextEditorProps,
  RichTextEditorTheme,
} from "./components/editor/types/editors";

export {
  RichTextEditor,
  NotionEditor,
  useTiptapEditor,
  RenderJSON,
  RenderHTML,
  RICH_TEXT_EDITOR_THEMES,
};

export type {
  NotionEditorProps,
  OnSaveArgs,
  RichTextEditorMode,
  RichTextEditorProps,
  RichTextEditorTheme,
};
