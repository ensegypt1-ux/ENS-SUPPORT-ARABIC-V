/**
 * Production build with stable memory/worker settings on Windows.
 * Used by `pnpm run build` and `pnpm run build:debug`.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");

const nodeOptions = [
  process.env.NODE_OPTIONS,
  "--max-old-space-size=8192",
]
  .filter(Boolean)
  .join(" ");

const env = {
  ...process.env,
  NODE_OPTIONS: nodeOptions,
  UV_THREADPOOL_SIZE: process.env.UV_THREADPOOL_SIZE || "4",
};

if (process.argv.includes("--debug")) {
  env.NEXT_DEBUG_BUILD = "1";
}

const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: projectRoot,
  stdio: "inherit",
  env,
});

process.exit(result.status ?? 1);
