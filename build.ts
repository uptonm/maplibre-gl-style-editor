import tailwind from "bun-plugin-tailwind";

const result = await Bun.build({
  entrypoints: ["./index.html"],
  outdir: "./dist",
  minify: true,
  sourcemap: "linked",
  env: "BUN_PUBLIC_*",
  plugins: [tailwind],
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

// The og:image meta tag isn't rewritten by the bundler, so its target has to
// exist at a stable root path.
await Bun.write("dist/og.png", Bun.file("public/og.png"));

console.log(`Built ${result.outputs.length} files to dist/`);
