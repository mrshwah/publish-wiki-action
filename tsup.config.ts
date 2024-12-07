import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  treeshake: true,
  external: ["@actions/core", "@actions/exec", "@actions/github", "glob"],
  platform: "node",
  target: "node20",
});
