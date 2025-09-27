import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { babel } from "@rollup/plugin-babel";
import copy from "rollup-plugin-copy";

export default {
  input: "src/main.ts",
  output: {
    file: "dist/main.js",
    format: "cjs",
    name: "ICalSync",
    banner: "// Google Apps Script Bundle - iCal to Google Calendar Sync",
  },
  plugins: [
    nodeResolve({
      preferBuiltins: false,
      browser: true,
    }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      sourceMap: false,
    }),
    babel({
      babelHelpers: "bundled",
      presets: [
        [
          "@babel/preset-env",
          {
            targets: {
              node: "10",
            },
            modules: false,
          },
        ],
      ],
    }),
    copy({
      targets: [{ src: "src/appsscript.json", dest: "dist" }],
    }),
  ],
  external: [],
  treeshake: true,
};
