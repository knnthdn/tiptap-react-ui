import { forwardRef, useCallback } from "react";

// --- Lib ---
import { parseShortcutKeys } from "../../../lib/tiptap-utils";

// --- Hooks ---
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor";

// --- Tiptap UI ---
import type { UseImageUploadConfig } from "../../tiptap-ui/image-upload-button";
import {
  IMAGE_UPLOAD_SHORTCUT_KEY,
  useImageUpload,
} from "../../tiptap-ui/image-upload-button";

// --- UI Primitives ---
import { Button } from "../../ui/button";
import { Badge } from "../../tiptap-ui-primitive/badge";
import { ImageUp } from "lucide-react";

type IconProps = React.SVGProps<SVGSVGElement>;
type IconComponent = ({ className, ...props }: IconProps) => React.ReactElement;

export interface ImageUploadButtonProps
  extends
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type">,
    UseImageUploadConfig {
  /**
   * Optional text to display alongside the icon.
   */
  text?: string;
  /**
   * Optional show shortcut keys in the button.
   * @default false
   */
  showShortcut?: boolean;
  /**
   * Optional custom icon component to render instead of the default.
   */
  icon?: React.MemoExoticComponent<IconComponent> | React.FC<IconProps>;
}

export function ImageShortcutBadge({
  shortcutKeys = IMAGE_UPLOAD_SHORTCUT_KEY,
}: {
  shortcutKeys?: string;
}) {
  return <Badge>{parseShortcutKeys({ shortcutKeys })}</Badge>;
}

/**
 * Button component for uploading/inserting images in a Tiptap editor.
 *
 * For custom button implementations, use the `useImage` hook instead.
 */
export const ImageUploadButton = forwardRef<
  HTMLButtonElement,
  ImageUploadButtonProps
>(
  (
    {
      editor: providedEditor,
      text,
      hideWhenUnavailable = false,
      onInserted,
      showShortcut = false,
      onClick,

      children,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor(providedEditor);
    const { isVisible, canInsert, handleImage, label, isActive, shortcutKeys } =
      useImageUpload({
        editor,
        hideWhenUnavailable,
        onInserted,
      });

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        handleImage();
      },
      [handleImage, onClick],
    );

    if (!isVisible) {
      return null;
    }

    return (
      <Button
        title="Upload image"
        variant="ghost"
        size="sm"
        type="button"
        disabled={!canInsert}
        aria-label={label}
        aria-pressed={isActive}
        onClick={handleClick}
        className="px-0"
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <>
            <ImageUp className="size-4 text-foreground" />
            {text && <span className="text-foreground">{text}</span>}
            {showShortcut && <ImageShortcutBadge shortcutKeys={shortcutKeys} />}
          </>
        )}
      </Button>
    );
  },
);

ImageUploadButton.displayName = "ImageUploadButton";
