/**
 * Production build with stable memory/worker settings on Windows.
 * Used by `pnpm run build` and `pnpm run build:debug`.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const nextCacheDir = path.join(projectRoot, ".next");
const isWindows = process.platform === "win32";

/** Native crashes seen when Next.js build workers OOM or stack-fault on Windows. */
const WINDOWS_WORKER_CRASH_CODES = new Set([
  3221226505, // 0xC0000409 STATUS_STACK_BUFFER_OVERRUN
  3221225477, // 0xC0000005 access violation
]);

const nodeOptions = [
  process.env.NODE_OPTIONS,
  "--max-old-space-size=8192",
]
  .filter(Boolean)
  .join(" ");

function buildEnv({ debug = false } = {}) {
  const env = {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
    UV_THREADPOOL_SIZE: isWindows ? "1" : process.env.UV_THREADPOOL_SIZE || "4",
  };

  if (debug) {
    env.NEXT_DEBUG_BUILD = "1";
  }

  return env;
}

function runBuild({ debug = false } = {}) {
  return spawnSync(process.execPath, [nextBin, "build"], {
    cwd: projectRoot,
    stdio: "inherit",
    env: buildEnv({ debug }),
  });
}

function cleanNextCache() {
  if (fs.existsSync(nextCacheDir)) {
    fs.rmSync(nextCacheDir, { recursive: true, force: true });
  }
}

const debug = process.argv.includes("--debug");
let result = runBuild({ debug });

if (
  isWindows &&
  result.status != null &&
  WINDOWS_WORKER_CRASH_CODES.has(result.status)
) {
  console.warn(
    "\nBuild worker crashed on Windows; clearing .next and retrying with a single worker...\n"
  );
  cleanNextCache();
  result = runBuild({ debug });
}

process.exit(result.status ?? 1);
