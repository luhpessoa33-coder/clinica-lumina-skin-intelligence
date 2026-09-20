import { spawnSync } from "node:child_process";

const result = spawnSync("corepack", ["pnpm", "install", "--no-frozen-lockfile"], {
  cwd: new URL("..", import.meta.url),
  stdio: "inherit",
  env: { ...process.env, CI: "true" },
});

process.exit(result.status ?? 1);
