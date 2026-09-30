import sharp from "sharp";
import { readdir, mkdir, copyFile, writeFile } from "node:fs/promises";

await mkdir("assets/optimized", { recursive: true });
await mkdir("assets/fonts", { recursive: true });
const dimensions = {};
for (const name of await readdir("assets")) {
  if (!/\.(png|jpeg)$/.test(name)) continue;
  const output = `assets/optimized/${name.replace(/\.(png|jpeg)$/, ".webp")}`;
  const result = await sharp(`assets/${name}`)
    .rotate()
    .resize({
      width: name === "personal-photo.jpeg" ? 640 : 1440,
      withoutEnlargement: true,
    })
    .webp({ quality: 88, effort: 6 })
    .toFile(output);
  dimensions[name] = {
    width: result.width,
    height: result.height,
    bytes: result.size,
    output,
  };
}
await sharp("assets/dark-agent-01.png")
  .resize({ width: 720 })
  .webp({ quality: 88 })
  .toFile("assets/optimized/dark-agent-hero.webp");
await copyFile(
  "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  "assets/fonts/inter-latin.woff2",
);
await copyFile(
  "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2",
  "assets/fonts/ibm-plex-mono-latin.woff2",
);
await copyFile(
  "node_modules/@fontsource-variable/inter/LICENSE",
  "assets/fonts/inter-LICENSE.txt",
);
await copyFile(
  "node_modules/@fontsource/ibm-plex-mono/LICENSE",
  "assets/fonts/ibm-plex-mono-LICENSE.txt",
);
await mkdir(".qa", { recursive: true });
await writeFile(
  ".qa/image-dimensions.json",
  JSON.stringify(dimensions, null, 2),
);
console.log(
  `Optimized ${Object.keys(dimensions).length} images; originals preserved.`,
);
