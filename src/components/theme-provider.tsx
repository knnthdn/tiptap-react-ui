import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  enableStorage?: boolean;
  resetThemeKey?: string | number | boolean;
};

type ThemeProviderState = {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  enableStorage = true,
  resetThemeKey,
  ...props
}: ThemeProviderProps) {
  const shouldResetTheme = resetThemeKey !== undefined;
  const getResolvedTheme = (theme: Theme): "dark" | "light" => {
    if (theme !== "system") return theme;

    if (typeof window === "undefined") return "light";

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };
  const [theme, setThemeState] = useState<Theme>(() => {
    if (shouldResetTheme) return defaultTheme;

    return enableStorage
      ? (localStorage.getItem(storageKey) as Theme) || defaultTheme
      : defaultTheme;
  });
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(() =>
    getResolvedTheme(theme),
  );

  useEffect(() => {
    setResolvedTheme(getResolvedTheme(theme));

    if (theme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setResolvedTheme(getResolvedTheme("system"));

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  useEffect(() => {
    if (!shouldResetTheme) return;

    if (enableStorage) {
      localStorage.setItem(storageKey, defaultTheme);
    }

    setThemeState(defaultTheme);
  }, [defaultTheme, enableStorage, shouldResetTheme, storageKey, resetThemeKey]);

  const value = {
    theme,
    resolvedTheme,
    setTheme: (theme: Theme) => {
      if (enableStorage) {
        localStorage.setItem(storageKey, theme);
      }

      setThemeState(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
