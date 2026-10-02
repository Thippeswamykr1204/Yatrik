import { cp, access } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const standalone = resolve(root, ".next/standalone");
try {
  await access(resolve(standalone, "server.js"));
} catch {
  console.error(
    "Production output is missing. Run npm run build before npm start.",
  );
  process.exit(1);
}
await Promise.all([
  cp(resolve(root, "public"), resolve(standalone, "public"), {
    recursive: true,
  }),
  cp(resolve(root, ".next/static"), resolve(standalone, ".next/static"), {
    recursive: true,
  }),
]);
process.env.HOSTNAME ||= "0.0.0.0";
await import(pathToFileURL(resolve(standalone, "server.js")).href);
