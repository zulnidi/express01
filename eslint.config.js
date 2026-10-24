import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default [
  { ignores: ["coverage", "node_modules"] },
  js.configs.recommended,
  { languageOptions: { globals: globals.node, ecmaVersion: "latest", sourceType: "module" } },
  { files: ["tests/**"], languageOptions: { globals: { ...globals.node } } },
  { rules: { "no-unused-vars": ["error", { argsIgnorePattern: "^_" }] } },
  prettier,
];
