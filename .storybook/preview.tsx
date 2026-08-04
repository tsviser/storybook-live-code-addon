import type { Preview } from "@storybook/react-vite";
import "../src/styles.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "docs",
      values: [
        { name: "docs", value: "#f7f8fa" },
        { name: "dark", value: "#0b1015" }
      ]
    },
    controls: {
      sort: "none"
    },
    layout: "padded"
  }
};

export default preview;
