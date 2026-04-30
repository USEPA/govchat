import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
    ...nextCoreWebVitals,
    {
        rules: {
            "@typescript-eslint/no-var-requires": "off",
        },
    }
]);