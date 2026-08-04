import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": projectRoot,
    },
  },

  test: {
    environment: "node",
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
  },
});
