import "./validate.mjs";
import { mkdir, copyFile, cp, rm } from "node:fs/promises";
import { resolve, dirname, basename } from "node:path";
import { build } from "esbuild";

if (!process.exitCode) {
  const workspace = resolve(".");
  const output = resolve(workspace, "dist");
  if (dirname(output) !== workspace || basename(output) !== "dist")
    throw new Error("Unexpected output directory");
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const file of ["index.html", "robots.txt", "sitemap.xml"]) {
    await copyFile(file, `dist/${file}`);
  }
  await cp("assets", "dist/assets", { recursive: true });
  await build({
    entryPoints: ["styles.css", "script.js", "theme.js"],
    outdir: output,
    minify: true,
    target: ["es2020"],
    legalComments: "none",
  });
  console.log(
    "Static production output prepared in dist/. No application runtime or third-party scripts.",
  );
}
