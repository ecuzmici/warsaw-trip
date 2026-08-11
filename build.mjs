// Inline the data and the schedule logic into one self-contained page (G7).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const trip = JSON.parse(readFileSync("data/trip.json", "utf8"));
const schedule = readFileSync("src/schedule.mjs", "utf8").replace(/^export /gm, "");
const fonts = readFileSync("src/fonts.css", "utf8");
const template = readFileSync("src/app.html", "utf8");

const html = template
  .replace("__FONTS__", () => fonts)
  .replace("__SCHEDULE__", () => schedule)
  .replace("__TRIP__", () => JSON.stringify(trip))
  .replace(/__TITLE__/g, () => trip.title);

mkdirSync("docs", { recursive: true });
writeFileSync("docs/index.html", html);
writeFileSync("docs/.nojekyll", "");
console.log(`built docs/index.html (${(html.length / 1024).toFixed(1)} kB)`);
