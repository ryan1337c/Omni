import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["**/*.probe.ts"],
    // Probes exist to print results for a human; passing tests would otherwise hide them.
    silent: false,
    exclude: ["node_modules/**", ".next/**"],
  },
});
