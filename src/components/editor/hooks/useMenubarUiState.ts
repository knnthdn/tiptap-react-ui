import { useCallback, useReducer } from "react";

type MenubarUiState = {
  isLinkDialogOpen: boolean;
  linkUrl: string;
  isImageDialogOpen: boolean;
  imageUrl: string;
  imageAlt: string;
  imageTitle: string;
  imageInline: boolean;
  isInsertTableDialogOpen: boolean;
  tableRows: number;
  tableCols: number;
  tableWithHeaderRow: boolean;
  customHighlightColor: string;
  isHighlightMenuOpen: boolean;
  isFontSizeMenuOpen: boolean;
  isFontFamilyMenuOpen: boolean;
  isYoutubeDialogOpen: boolean;
  youtubeUrl: string;
  youtubeWidth: number;
  youtubeHeight: number;
  youtubeFullWidth: boolean;
  isTextColorMenuOpen: boolean;
  customTextColor: string;
  customTextColorInput: string;
  isAlignMenuOpen: boolean;
  isTextBlockMenuOpen: boolean;
};

type YoutubeDialogPayload = {
  url: string;
  width: number;
  height: number;
  fullWidth: boolean;
};

type MenubarUiAction =
  | { type: "patch"; patch: Partial<MenubarUiState> }
  | { type: "resetTableDialog" }
  | { type: "openYoutubeDialog"; payload: YoutubeDialogPayload };

function getInitialMenubarUiState(highlightColor: string): MenubarUiState {
  return {
    isLinkDialogOpen: false,
    linkUrl: "https://",
    isImageDialogOpen: false,
    imageUrl: "https://",
    imageAlt: "",
    imageTitle: "",
    imageInline: false,
    isInsertTableDialogOpen: false,
    tableRows: 3,
    tableCols: 3,
    tableWithHeaderRow: true,
    customHighlightColor: highlightColor,
    isHighlightMenuOpen: false,
    isFontSizeMenuOpen: false,
    isFontFamilyMenuOpen: false,
    isYoutubeDialogOpen: false,
    youtubeUrl: "",
    youtubeWidth: 640,
    youtubeHeight: 480,
    youtubeFullWidth: false,
    isTextColorMenuOpen: false,
    customTextColor: "#111827",
    customTextColorInput: "#111827",
    isAlignMenuOpen: false,
    isTextBlockMenuOpen: false,
  };
}

function menubarUiReducer(
  state: MenubarUiState,
  action: MenubarUiAction,
): MenubarUiState {
  switch (action.type) {
    case "patch":
      return { ...state, ...action.patch };
    case "resetTableDialog":
      return {
        ...state,
        tableRows: 3,
        tableCols: 3,
        tableWithHeaderRow: true,
        isInsertTableDialogOpen: true,
      };
    case "openYoutubeDialog":
      return {
        ...state,
        isYoutubeDialogOpen: true,
        youtubeUrl: action.payload.url,
        youtubeWidth: action.payload.width,
        youtubeHeight: action.payload.height,
        youtubeFullWidth: action.payload.fullWidth,
      };
  }
}

export function useMenubarUiState(highlightColor: string) {
  const [uiState, dispatchUiState] = useReducer(
    menubarUiReducer,
    highlightColor,
    getInitialMenubarUiState,
  );

  const patchUiState = useCallback((patch: Partial<MenubarUiState>) => {
    dispatchUiState({ type: "patch", patch });
  }, []);

  return {
    uiState,
    actions: {
      openYoutubeDialog: useCallback((payload: YoutubeDialogPayload) => {
        dispatchUiState({ type: "openYoutubeDialog", payload });
      }, []),
      resetTableDialog: useCallback(() => {
        dispatchUiState({ type: "resetTableDialog" });
      }, []),
      setIsLinkDialogOpen: useCallback(
        (isOpen: boolean) => patchUiState({ isLinkDialogOpen: isOpen }),
        [patchUiState],
      ),
      setLinkUrl: useCallback(
        (url: string) => patchUiState({ linkUrl: url }),
        [patchUiState],
      ),
      setIsImageDialogOpen: useCallback(
        (isOpen: boolean) => patchUiState({ isImageDialogOpen: isOpen }),
        [patchUiState],
      ),
      setImageUrl: useCallback(
        (url: string) => patchUiState({ imageUrl: url }),
        [patchUiState],
      ),
      setImageAlt: useCallback(
        (alt: string) => patchUiState({ imageAlt: alt }),
        [patchUiState],
      ),
      setImageTitle: useCallback(
        (title: string) => patchUiState({ imageTitle: title }),
        [patchUiState],
      ),
      setImageInline: useCallback(
        (inline: boolean) => patchUiState({ imageInline: inline }),
        [patchUiState],
      ),
      setIsInsertTableDialogOpen: useCallback(
        (isOpen: boolean) =>
          patchUiState({ isInsertTableDialogOpen: isOpen }),
        [patchUiState],
      ),
      setTableRows: useCallback(
        (rows: number) => patchUiState({ tableRows: rows }),
        [patchUiState],
      ),
      setTableCols: useCallback(
        (cols: number) => patchUiState({ tableCols: cols }),
        [patchUiState],
      ),
      setTableWithHeaderRow: useCallback(
        (withHeaderRow: boolean) =>
          patchUiState({ tableWithHeaderRow: withHeaderRow }),
        [patchUiState],
      ),
      setCustomHighlightColor: useCallback(
        (color: string) => patchUiState({ customHighlightColor: color }),
        [patchUiState],
      ),
      setIsHighlightMenuOpen: useCallback(
        (isOpen: boolean) => patchUiState({ isHighlightMenuOpen: isOpen }),
        [patchUiState],
      ),
      setIsFontSizeMenuOpen: useCallback(
        (isOpen: boolean) => patchUiState({ isFontSizeMenuOpen: isOpen }),
        [patchUiState],
      ),
      setIsFontFamilyMenuOpen: useCallback(
        (isOpen: boolean) => patchUiState({ isFontFamilyMenuOpen: isOpen }),
        [patchUiState],
      ),
      setIsYoutubeDialogOpen: useCallback(
        (isOpen: boolean) => patchUiState({ isYoutubeDialogOpen: isOpen }),
        [patchUiState],
      ),
      setYoutubeUrl: useCallback(
        (url: string) => patchUiState({ youtubeUrl: url }),
        [patchUiState],
      ),
      setYoutubeWidth: useCallback(
        (width: number) => patchUiState({ youtubeWidth: width }),
        [patchUiState],
      ),
      setYoutubeHeight: useCallback(
        (height: number) => patchUiState({ youtubeHeight: height }),
        [patchUiState],
      ),
      setYoutubeFullWidth: useCallback(
        (fullWidth: boolean) =>
          patchUiState({ youtubeFullWidth: fullWidth }),
        [patchUiState],
      ),
      setIsTextColorMenuOpen: useCallback(
        (isOpen: boolean) => patchUiState({ isTextColorMenuOpen: isOpen }),
        [patchUiState],
      ),
      setCustomTextColor: useCallback(
        (color: string) => patchUiState({ customTextColor: color }),
        [patchUiState],
      ),
      setCustomTextColorInput: useCallback(
        (color: string) => patchUiState({ customTextColorInput: color }),
        [patchUiState],
      ),
      setIsAlignMenuOpen: useCallback(
        (isOpen: boolean) => patchUiState({ isAlignMenuOpen: isOpen }),
        [patchUiState],
      ),
      setIsTextBlockMenuOpen: useCallback(
        (isOpen: boolean) => patchUiState({ isTextBlockMenuOpen: isOpen }),
        [patchUiState],
      ),
    },
  };
}
