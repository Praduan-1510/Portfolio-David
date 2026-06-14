// Flat ESLint config (Next 16 / ESLint 9). eslint-config-next ships native flat
// configs at these subpaths, so we import them directly — the older FlatCompat
// (@eslint/eslintrc) shim throws a "circular structure" error on this plugin set.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "scripts/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
