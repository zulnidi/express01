import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["src/server.js", "src/repositories/cancion.mongo.repository.js"],
      reporter: ["text", "html"],
    },
  },
});
