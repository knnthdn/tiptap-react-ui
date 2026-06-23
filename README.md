# tiptap-react-ui

A prebuilt React rich text editor powered by Tiptap. It includes a full toolbar editor, a Notion-like editor, saved-content renderers, built-in themes, tables, images, YouTube embeds, code blocks, and more.

## Installation

```bash
npm install tiptap-react-ui @tiptap/core @tiptap/pm @tiptap/react
```

Import the bundled stylesheet once in your app:

```tsx
import "tiptap-react-ui/style.css";
```

You do not need to install Tailwind CSS or shadcn/ui to use the distributed styles.

## Basic Usage

```tsx
import "tiptap-react-ui/style.css";
import { RichTextEditor, useTiptapEditor } from "tiptap-react-ui";

export default function Editor() {
  const { editor, isEditorLoading } = useTiptapEditor({
    placeholder: "Write something...",
  });

  if (isEditorLoading) return null;

  return (
    <RichTextEditor
      editor={editor}
      theme="violet"
      mode="light"
      wrapperClassName="max-w-5xl mx-auto"
    />
  );
}
```

## Notion-like Editor

```tsx
import "tiptap-react-ui/style.css";
import { NotionEditor, useTiptapEditor } from "tiptap-react-ui";

export default function NotionPage() {
  const { editor, isEditorLoading } = useTiptapEditor({
    placeholder: "Write, type '/' for commands",
  });

  if (isEditorLoading) return null;

  return <NotionEditor editor={editor} className="max-w-4xl mx-auto" />;
}
```

## Render Saved Content

```tsx
import { RenderJSON, RenderHTML } from "tiptap-react-ui";

<RenderJSON content={jsonContent} />;
<RenderHTML content={htmlContent} />;
```

## Features

- Full rich text editor with toolbar and preview support
- Notion-like editor with slash commands and bubble menu
- Built-in light, dark, and themed editor styles
- Tables with cell, row, and column controls
- Image upload, remote images, resizing, alignment, and inline images
- YouTube embeds
- Code blocks with syntax highlighting
- Text color and highlight color controls
- Word and character count
- Optional table of contents for JSON-rendered content
- Feature visibility controls with `extensionState`
- Scoped CSS that does not require consumer Tailwind or shadcn/ui setup

## License

MIT

A star would be much appreciated ⭐
