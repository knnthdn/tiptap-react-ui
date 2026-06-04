export const CONSTANTS = {
  wrapperStyle: {
    display: "flex",
    width: "100%",
  } as CSSStyleDeclaration,
  containerStyle: {
    cursor: "pointer",
  } as CSSStyleDeclaration,
  MOBILE_BREAKPOINT: 768,
  ICON_SIZE: "24px",
  CONTROLLER_HEIGHT: "25px",
  DOT_SIZE: {
    MOBILE: 16,
    DESKTOP: 9,
  },
  DOT_POSITION: {
    MOBILE: "-8px",
    DESKTOP: "-4px",
  },
  COLORS: {
    BORDER: "#7C3AED",
    BACKGROUND: "rgba(0, 0, 0, 0.15)",
  },
  ICONS: {
    LEFT: "AlignLeft",
    CENTER: "AlignCenter",
    RIGHT: "AlignRight",
  },
} as const;
