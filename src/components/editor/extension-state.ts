import type { KeyboardEvent } from "react";
import type {
  EditorExtensionName,
  EditorExtensionState,
  EditorExtensionStateMap,
} from "./types/editors";

const GROUP_CHILDREN: Partial<Record<EditorExtensionName, EditorExtensionName[]>> = {
  history: ["undo", "redo"],
  typography: ["heading", "fontFamily", "fontSize"],
  textAlign: ["alignLeft", "alignCenter", "alignRight", "alignJustify"],
};

const CHILD_GROUPS: Partial<Record<EditorExtensionName, EditorExtensionName>> =
  Object.fromEntries(
    Object.entries(GROUP_CHILDREN).flatMap(([group, children]) =>
      children.map((child) => [child, group as EditorExtensionName]),
    ),
  ) as Partial<Record<EditorExtensionName, EditorExtensionName>>;

export function getExtensionState(
  extensionState: EditorExtensionStateMap | undefined,
  extension: EditorExtensionName,
): EditorExtensionState {
  const ownState = extensionState?.[extension];
  const groupState = CHILD_GROUPS[extension]
    ? extensionState?.[CHILD_GROUPS[extension]]
    : undefined;

  if (ownState) return ownState;
  if (groupState) return groupState;

  return "visible";
}

export function isExtensionHidden(
  extensionState: EditorExtensionStateMap | undefined,
  extension: EditorExtensionName,
) {
  return getExtensionState(extensionState, extension) === "hidden";
}

export function isExtensionDisabled(
  extensionState: EditorExtensionStateMap | undefined,
  extension: EditorExtensionName,
) {
  return getExtensionState(extensionState, extension) === "disable";
}

export function isExtensionUnavailable(
  extensionState: EditorExtensionStateMap | undefined,
  extension: EditorExtensionName,
) {
  return getExtensionState(extensionState, extension) !== "visible";
}

export function getExtensionGroupState(
  extensionState: EditorExtensionStateMap | undefined,
  extensions: EditorExtensionName[],
) {
  const states = extensions.map((extension) =>
    getExtensionState(extensionState, extension),
  );

  return {
    disabled:
      states.length > 0 && states.every((state) => state === "disable"),
    hidden: states.length > 0 && states.every((state) => state === "hidden"),
  };
}

function isUnavailable(
  extensionState: EditorExtensionStateMap | undefined,
  extension: EditorExtensionName,
) {
  return isExtensionUnavailable(extensionState, extension);
}

export function shouldBlockExtensionShortcut(
  event: KeyboardEvent<HTMLElement>,
  extensionState: EditorExtensionStateMap | undefined,
) {
  const key = event.key.toLowerCase();
  const mod = event.ctrlKey || event.metaKey;
  const shift = event.shiftKey;
  const alt = event.altKey;

  if (!mod) return false;

  if (!shift && !alt && key === "z") {
    return isUnavailable(extensionState, "undo");
  }

  if ((!alt && key === "y") || (!alt && shift && key === "z")) {
    return isUnavailable(extensionState, "redo");
  }

  if (!alt && !shift && key === "b") {
    return isUnavailable(extensionState, "bold");
  }

  if (!alt && !shift && key === "i") {
    return isUnavailable(extensionState, "italic");
  }

  if (!alt && shift && key === "i") {
    return isUnavailable(extensionState, "imageUpload");
  }

  if (!alt && !shift && key === "u") {
    return isUnavailable(extensionState, "underline");
  }

  if (!alt && shift && key === "x") {
    return isUnavailable(extensionState, "strike");
  }

  if (!alt && !shift && key === "e") {
    return isUnavailable(extensionState, "inlineCode");
  }

  if (alt && !shift && /^[1-6]$/.test(key)) {
    return isUnavailable(extensionState, "heading");
  }

  if (!alt && shift && key === "8") {
    return isUnavailable(extensionState, "bulletList");
  }

  if (!alt && shift && key === "7") {
    return isUnavailable(extensionState, "orderedList");
  }

  if (!alt && shift && key === "9") {
    return isUnavailable(extensionState, "taskList");
  }

  if (!alt && shift && key === "b") {
    return isUnavailable(extensionState, "blockquote");
  }

  if (alt && !shift && key === "c") {
    return isUnavailable(extensionState, "codeBlock");
  }

  if (!alt && !shift && key === "enter") {
    return isUnavailable(extensionState, "hardBreak");
  }

  if (!alt && !shift && key === "k") {
    return isUnavailable(extensionState, "link");
  }

  if (!alt && shift && key === "l") {
    return isUnavailable(extensionState, "alignLeft");
  }

  if (!alt && shift && key === "e") {
    return isUnavailable(extensionState, "alignCenter");
  }

  if (!alt && shift && key === "r") {
    return isUnavailable(extensionState, "alignRight");
  }

  if (!alt && shift && key === "j") {
    return isUnavailable(extensionState, "alignJustify");
  }

  return false;
}
