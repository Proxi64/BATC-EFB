// Writes package/layout.json: the list of every file in the package (path, size, date)
// that the simulator reads to mount it. manifest.json and layout.json are not listed.
// Also updates total_package_size in package/manifest.json.
// Paths keep their real case (lowercasing them breaks the package under Wine/Proton).
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const pkg = join(dirname(fileURLToPath(import.meta.url)), "..", "package");
const SKIP = new Set(["layout.json", "manifest.json"]);
// Windows FILETIME: 100 ns ticks since 1601-01-01.
const EPOCH_DIFF_MS = 11644473600000;

function walk(dir, out) {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) { walk(full, out); continue; }
    const path = relative(pkg, full).split(sep).join("/");
    if (SKIP.has(path)) continue;
    out.push({ path, size: st.size, date: (Math.floor(st.mtimeMs) + EPOCH_DIFF_MS) * 10000 });
  }
  return out;
}

const content = walk(pkg, []);
writeFileSync(join(pkg, "layout.json"), JSON.stringify({ content }, null, 2) + "\n");
console.log(`layout.json: ${content.length} file(s)`);

const manifestPath = join(pkg, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const layoutSize = statSync(join(pkg, "layout.json")).size;
const total = content.reduce((n, f) => n + f.size, 0) + layoutSize;
manifest.total_package_size = String(total).padStart(20, "0");
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`manifest.json: total_package_size ${total}`);
