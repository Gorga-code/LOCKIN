import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    // Guardrail: the service-role client may only be imported from server-only modules.
    files: ["src/components/**", "src/app/**/*.tsx", "src/hooks/**", "src/workers/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/admin",
              message: "The service-role client is server-only. Use it from route handlers/lib only.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "extension/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "public/models/**",
    "public/mediapipe/**",
  ]),
]);

export default eslintConfig;
