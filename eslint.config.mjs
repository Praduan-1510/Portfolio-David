// Flat ESLint config (Next 16 / ESLint 9). eslint-config-next ships native flat
// configs at these subpaths, so we import them directly — the older FlatCompat
// (@eslint/eslintrc) shim throws a "circular structure" error on this plugin set.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Interface/** is a vendored v0/template export that src/ never imports; it
    // trips React-19 lint rules and isn't ours to fix, so keep it out of the gate.
    ignores: [".next/**", "node_modules/**", "scripts/**", "Interface/**", "next-env.d.ts"],
  },
  {
    // React-19 experimental hooks rules (eslint-plugin-react-hooks v6). Each site
    // that trips these was reviewed and is correct: one-shot mount/route seeds
    // (set-state-in-effect), createElement(Tag,{ref}) forwarding that never reads
    // .current in render (refs), and a useFrame uniform mutation outside render
    // (purity). Keep them as warnings so genuine future cases stay visible without
    // failing CI on these false positives.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      // useFrame mutating a material ref's uniform outside render (HeroCanvas).
      "react-hooks/immutability": "warn",
    },
  },
];

export default eslintConfig;
