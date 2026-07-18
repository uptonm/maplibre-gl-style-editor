import tailwind from "bun-plugin-tailwind";

function publicEnv(name: string): string {
  return JSON.stringify(process.env[name] ?? "");
}

const result = await Bun.build({
  entrypoints: ["./index.html"],
  outdir: "./dist",
  minify: true,
  sourcemap: "linked",
  // MapTiler and other client secrets use BUN_PUBLIC_*. Clerk fleet keys use
  // NEXT_PUBLIC_* (shared with the Vercel edge middleware), so define them.
  env: "BUN_PUBLIC_*",
  define: {
    "process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": publicEnv(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    ),
    "process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL": publicEnv(
      "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
    ),
    "process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL": publicEnv(
      "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
    ),
  },
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
