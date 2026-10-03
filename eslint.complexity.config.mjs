import base from "./eslint.config.mjs";

// Used only by `make complexity`: reuses the base lint setup (parser for TS)
// and adds the cyclomatic complexity rule (max 10 per function).
const config = [
  ...base,
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    rules: {
      complexity: ["error", 10],
    },
  },
];

export default config;
