// Removes the <metadata> block (C2PA "Content Credentials" manifest) from SVG files.
// Some tools and file transfers add ~8 KB of base64 there; the drawing is unchanged.
//
// Used by app/build.mjs on the package assets, and from the command line on source files:
//   node tools/strip-svg-metadata.mjs app/src/Assets/app-icon.svg [more.svg …]
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Returns the SVG text without <metadata> blocks and without the c2pa namespace declaration. */
export function stripSvgMetadata(svg) {
  return svg
    .replace(/<metadata[\s>][\s\S]*?<\/metadata>/g, "")
    .replace(/\s+xmlns:c2pa="[^"]*"/g, "");
}

/** Cleans one file in place. Returns true when the file was changed. */
export function stripSvgFile(file) {
  const svg = readFileSync(file, "utf8");
  const clean = stripSvgMetadata(svg);
  if (clean === svg) return false;
  writeFileSync(file, clean);
  return true;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error("Usage: node tools/strip-svg-metadata.mjs <file.svg> [more.svg …]");
    process.exit(1);
  }
  for (const f of files) {
    const before = readFileSync(f).length;
    const changed = stripSvgFile(f);
    console.log(changed ? `${f}: ${before} -> ${readFileSync(f).length} bytes` : `${f}: already clean`);
  }
}
