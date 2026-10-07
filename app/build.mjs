// Builds the EFB app into the Community package:
//   ../package/html_ui/efb_ui/efb_apps/BatcEfb/
//     BatcEfb.js, BatcEfb.css   the EFB shell (src/shell)
//     web/                      the BATC web app shown in the shell's frame (src/web)
//     Assets/                   app icon
// Both parts target ES2017 with plain (non-module) scripts, like the official EFB template:
// the simulator's JavaScript engine is older than a current browser.
import esbuild from "esbuild";
import { globalExternals } from "@fal-works/esbuild-plugin-global-externals";
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stripSvgFile } from "../tools/strip-svg-metadata.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const APP = "BatcEfb";
const outdir = join(root, "..", "package", "html_ui", "efb_ui", "efb_apps", APP);
const webOut = join(outdir, "web");
const watch = process.argv.includes("--watch");
const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;

rmSync(outdir, { recursive: true, force: true });
mkdirSync(webOut, { recursive: true });
copyAssets(join(root, "src", "Assets"), join(outdir, "Assets"));

const common = {
  bundle: true,
  target: "es2017",
  sourcemap: false,
  minify: false,
  logLevel: "info"
};

/** EFB shell: FSComponent JSX; the MSFS SDK is provided by the simulator as the global "msfssdk". */
const shell = {
  ...common,
  entryPoints: [join(root, "src", "shell", `${APP}.tsx`)],
  outdir,
  tsconfig: join(root, "tsconfig.json"),
  keepNames: true,
  jsx: "transform",
  jsxFactory: "FSComponent.buildComponent",
  jsxFragment: "FSComponent.Fragment",
  define: { BASE_URL: JSON.stringify(`coui://html_ui/efb_ui/efb_apps/${APP}`) },
  plugins: [globalExternals({ "@microsoft/msfs-sdk": { varName: "msfssdk", type: "cjs" } })]
};

/** Web app: Preact, one classic script (app.js) and one stylesheet (app.css) with its fonts. */
const web = {
  ...common,
  entryPoints: { app: join(root, "src", "web", "main.tsx") },
  outdir: webOut,
  tsconfig: join(root, "tsconfig.web.json"),
  format: "iife",
  jsx: "automatic",
  jsxImportSource: "preact",
  loader: { ".ttf": "file" },
  assetNames: "fonts/[name]",
  define: { __APP_VERSION__: JSON.stringify(version) }
};

const INDEX_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BATC EFB</title>
<link rel="stylesheet" href="app.css">
</head>
<body>
<div id="app"></div>
<script src="app.js"></script>
</body>
</html>
`;

if (watch) {
  writeFileSync(join(webOut, "index.html"), INDEX_HTML);
  for (const cfg of [shell, web]) await (await esbuild.context(cfg)).watch();
} else {
  await esbuild.build(shell);
  await esbuild.build(web);
  writeFileSync(join(webOut, "index.html"), INDEX_HTML);
  for (const f of [join(outdir, `${APP}.js`), join(outdir, `${APP}.css`), join(webOut, "app.js"), join(webOut, "app.css")]) asciiOnly(f);
}

/**
 * Copies the app assets. SVG files are written without their <metadata> block: some tools
 * (and some file transfers) add a C2PA "Content Credentials" manifest there, ~8 KB of base64
 * that the EFB does not need. The drawing is unchanged (see tools/strip-svg-metadata.mjs).
 */
function copyAssets(from, to) {
  cpSync(from, to, { recursive: true });
  for (const name of readdirSync(to)) {
    if (name.toLowerCase().endsWith(".svg")) stripSvgFile(join(to, name));
  }
}

/** esbuild escapes non-ASCII in code but keeps it in comments and CSS: escape what is left. */
function asciiOnly(file) {
  const text = readFileSync(file, "utf8");
  const css = file.endsWith(".css");
  // In CSS, a "\XXXX " escape is valid everywhere (strings and content:), "\uXXXX" is not.
  writeFileSync(file, text.replace(/[^\x00-\x7f]/g, c => {
    const hex = c.charCodeAt(0).toString(16);
    return css ? `\\${hex} ` : `\\u${hex.padStart(4, "0")}`;
  }));
}
