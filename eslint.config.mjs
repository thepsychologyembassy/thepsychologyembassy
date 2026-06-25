import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Explicitly target our code files to ensure the overrides apply
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Downgrade to warnings (will show in terminal, but won't break the build)
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "import/no-anonymous-default-export": "warn",
      
      // Turn off entirely (purely stylistic React rules that are safe to ignore)
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "off"
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;