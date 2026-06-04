import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "tiptap-react-ui",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [
        /^react(-dom)?(\/.+)?$/,
        /^@base-ui(\/.+)?$/,
        "@tiptap/pm",
        "@tiptap/react",
        "@tiptap/starter-kit",
        "@tiptap/core",
        /^prosemirror-.+$/,
        "tailwindcss",
        "radix-ui",
        "lucide-react",
        "shadcn",
      ],
    },
    cssCodeSplit: true,
    sourcemap: true,
    emptyOutDir: true,
  },
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      bundleTypes: true,
    }),
    tailwindcss(),
  ],
});
