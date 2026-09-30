import { HtmlValidate } from "html-validate";
import { readFile, access } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const html = await readFile("index.html", "utf8");
const validator = new HtmlValidate({
  extends: ["html-validate:recommended"],
  rules: {
    "no-inline-style": "off",
    "long-title": "off",
    "void-style": "off",
    "doctype-style": "off",
  },
});
const report = await validator.validateString(html, "index.html");
const failures = [];
for (const result of report.results) {
  for (const message of result.messages)
    failures.push(
      `HTML ${message.line}:${message.column} ${message.message} (${message.ruleId})`,
    );
}
const ids = new Set(
  [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]),
);
for (const [, reference] of html.matchAll(
  /\b(?:href|src|data-preview|data-optimized)="([^"]+)"/g,
)) {
  if (reference.startsWith("#")) {
    if (!ids.has(reference.slice(1)))
      failures.push(`Missing anchor: ${reference}`);
  } else if (!/^(?:https?:|mailto:|data:)/.test(reference)) {
    try {
      await access(decodeURIComponent(reference));
    } catch {
      failures.push(`Missing asset: ${reference}`);
    }
  }
}
for (const [, attributes] of html.matchAll(/<img\s+([^>]+)>/g)) {
  if (
    !attributes.includes('id="modalImage"') &&
    (!/width="\d+"/.test(attributes) || !/height="\d+"/.test(attributes))
  )
    failures.push(`Image missing dimensions: ${attributes.slice(0, 90)}`);
}
const resumeLinks = [
  ...new Set(
    [...html.matchAll(/href="([^"]+\.pdf)"/g)].map((match) => match[1]),
  ),
];
if (
  resumeLinks.length !== 1 ||
  resumeLinks[0] !== "assets/MohamedBassam%20CV%20Improved%20.pdf"
)
  failures.push("CV links must use the single current PDF.");
if (/\bJunior\b|Open New CV/i.test(html))
  failures.push("Outdated role or CV copy.");
if (/github\.com\/[^"\s]*dark[-_]agent/i.test(html))
  failures.push("Private Dark Agent repository must not be linked.");
for (const source of ["script.js", "theme.js"])
  execFileSync(process.execPath, ["--check", source]);
JSON.parse(await readFile("vercel.json", "utf8"));
for (const [, json] of html.matchAll(
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
))
  JSON.parse(json);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    "Production validation passed: semantic HTML, JavaScript syntax, local assets, anchors, image dimensions, CV consistency, structured data, and Vercel configuration.",
  );
