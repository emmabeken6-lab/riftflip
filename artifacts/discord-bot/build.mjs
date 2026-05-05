import { build } from "esbuild";

await build({
  entryPoints: ["src/index.js"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "dist/index.mjs",
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
  external: ["discord.js"],
});
