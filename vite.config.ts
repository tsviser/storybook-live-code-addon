import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/index.ts",
      fileName: "storybook-live-code",
      formats: ["es"],
      name: "StorybookLiveCode"
    },
    rollupOptions: {
      external: [/^@codemirror\//, "react", "react-dom", "react/jsx-runtime", "react-live"]
    }
  }
});
