import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-Us", {
    weekday: "short",
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

export const MAC_SYMBOLS: Record<string, string> = {
  mod: "⌘",
  command: "⌘",
  meta: "⌘",
  ctrl: "⌃",
  control: "⌃",
  alt: "⌥",
  option: "⌥",
  shift: "⇧",
  backspace: "Del",
  delete: "⌦",
  enter: "⏎",
  escape: "⎋",
  capslock: "⇪",
} as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const handleImageUploadFallback = async (
  file: File,
  onProgress?: (event: { progress: number }) => void,
  abortSignal?: AbortSignal,
): Promise<string> => {
  // Validate file
  if (!file) {
    throw new Error("No file provided");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB)`,
    );
  }

  // Convert file to base64 as fallback
  return new Promise((resolve, reject) => {
    if (abortSignal?.aborted) {
      reject(new Error("Upload cancelled"));
      return;
    }

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress?.({ progress });
      }
    };

    reader.onload = () => {
      if (abortSignal?.aborted) {
        reject(new Error("Upload cancelled"));
        return;
      }
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    abortSignal?.addEventListener("abort", () => {
      reader.abort();
      reject(new Error("Upload cancelled"));
    });

    reader.readAsDataURL(file);
  });
};

/**
 * Determines if the current platform is macOS
 * @returns boolean indicating if the current platform is Mac
 */
export function isMac(): boolean {
  return (
    typeof navigator !== "undefined" &&
    navigator.platform.toLowerCase().includes("mac")
  );
}

/**
 * Formats a shortcut key based on the platform (Mac or non-Mac)
 * @param key - The key to format (e.g., "ctrl", "alt", "shift")
 * @param isMac - Boolean indicating if the platform is Mac
 * @param capitalize - Whether to capitalize the key (default: true)
 * @returns Formatted shortcut key symbol
 */
export const formatShortcutKey = (
  key: string,
  isMac: boolean,
  capitalize: boolean = true,
) => {
  if (isMac) {
    const lowerKey = key.toLowerCase();
    return MAC_SYMBOLS[lowerKey] || (capitalize ? key.toUpperCase() : key);
  }

  return capitalize ? key.charAt(0).toUpperCase() + key.slice(1) : key;
};
