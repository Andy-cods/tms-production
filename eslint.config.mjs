import next from "eslint-config-next";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default [
  // Next.js provides Flat Config presets (ESLint 9+). Using these directly avoids
  // compat-layer edge cases and keeps behavior aligned with Next defaults.
  ...next,
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      // Repo scripts are not part of the app runtime; keep lint signal high.
      "scripts/**",
      "prisma/**",
      "__tests__/**",
      "playwright-report/**",
      // One-off maintenance tooling / deployment config (not app runtime)
      "check-db2.js",
      "cleanup-*.js",
      "execute-cleanup-plan.js",
      "create-admin.js",
      "create-user.js",
      "ecosystem.config.js",
      "jest.config.js",
      "jest.setup.js",
      "import-employees-from-csv.ts",
    ],
  },
  {
    // Keep lint actionable for a large legacy codebase: prioritize dead-code and
    // correctness issues, while allowing incremental typing improvements.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "prefer-const": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/set-state-in-effect": "off",
      // The "purity" rule is too strict for existing UI (e.g. Date.now for relative
      // times). Keep behavior stable and tackle these incrementally.
      "react-hooks/purity": "off",
    },
  },
];


