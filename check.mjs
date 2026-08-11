// Gate for the guarantees in GUARANTEES.md. Exit 0 means every check passed.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { toMinutes } from "./src/schedule.mjs";

const trip = JSON.parse(readFileSync("data/trip.json", "utf8"));
const fail = [];
const bad = (g, msg) => fail.push(`${g}: ${msg}`);

const allItems = trip.days.flatMap((d) => d.items.map((it) => ({ ...it, date: d.date })));

// G1 — every location carries a Google Maps URL.
for (const it of allItems) {
  if (typeof it.maps !== "string" || it.maps.trim() === "") {
    bad("G1", `${it.id} "${it.name}" has no maps URL`);
  } else if (!/^https:\/\/www\.google\.com\/maps\//.test(it.maps)) {
    bad("G1", `${it.id} "${it.name}" maps URL is not a google.com/maps URL`);
  }
}

// G4 — no overlap inside a day, and every item ends after it starts.
for (const day of trip.days) {
  const items = [...day.items].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  for (const it of items) {
    if (toMinutes(it.end) <= toMinutes(it.start)) {
      bad("G4", `${it.id} ends at or before it starts (${it.start}-${it.end})`);
    }
  }
  for (let i = 1; i < items.length; i++) {
    if (toMinutes(items[i].start) < toMinutes(items[i - 1].end)) {
      bad("G4", `${items[i - 1].id} and ${items[i].id} overlap on ${day.date}`);
    }
  }
}

// G5 — every item sits inside its venue's opening hours.
for (const it of allItems) {
  if (!it.hours) { bad("G5", `${it.id} "${it.name}" has no hours`); continue; }
  const open = toMinutes(it.hours.open);
  const close = toMinutes(it.hours.close); // may exceed 24:00 for late venues
  if (toMinutes(it.start) < open) {
    bad("G5", `${it.id} "${it.name}" starts ${it.start}, venue opens ${it.hours.open}`);
  }
  if (toMinutes(it.end) > close) {
    bad("G5", `${it.id} "${it.name}" ends ${it.end}, venue closes ${it.hours.close}`);
  }
}

// G6 — the gap before an item is at least its travel time.
for (const day of trip.days) {
  const items = [...day.items].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  for (let i = 1; i < items.length; i++) {
    const gap = toMinutes(items[i].start) - toMinutes(items[i - 1].end);
    const need = items[i].travelMin ?? 0;
    if (gap < need) {
      bad("G6", `${items[i].id} "${items[i].name}": ${gap} min gap, needs ${need}`);
    }
  }
}

// G8 — no location name, address, or time lives outside data/trip.json.
const SOURCE_DIRS = ["src", "test", "tools"];
const sources = [];
for (const dir of SOURCE_DIRS) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isFile() && [".html", ".mjs", ".js", ".css"].includes(extname(p))) {
      sources.push(p);
    }
  }
}
sources.push("check.mjs", "build.mjs");
const needles = new Set();
for (const it of allItems) { needles.add(it.name); needles.add(it.address); }
for (const p of sources) {
  const text = readFileSync(p, "utf8");
  for (const n of needles) {
    if (n && text.includes(n)) bad("G8", `${p} hardcodes "${n}"`);
  }
  const times = text.match(/(?<![\d:])(?:[01]?\d|2[0-3]):[0-5]\d(?![\d:])/g);
  if (times) bad("G8", `${p} hardcodes a clock time: ${[...new Set(times)].join(", ")}`);
}

// G7 — the published page pulls nothing off the network.
const OUT = "docs/index.html";
if (existsSync(OUT)) {
  const html = readFileSync(OUT, "utf8");
  const loaders = [
    [/<script[^>]+\bsrc=/i, "<script src=>"],
    [/<link[^>]+\bhref=/i, "<link href=>"],
    [/<img[^>]+\bsrc=["']?https?:/i, "remote <img>"],
    [/@import/i, "@import"],
    [/\bfetch\s*\(/, "fetch()"],
    [/XMLHttpRequest/, "XMLHttpRequest"],
    [/new\s+Worker\s*\(/, "Worker"],
    [/url\(\s*['"]?https?:/i, "remote url() in CSS"],
  ];
  for (const [re, what] of loaders) {
    if (re.test(html)) bad("G7", `${OUT} loads ${what} at runtime`);
  }
}

if (fail.length) {
  console.error("FAIL\n" + fail.map((f) => "  " + f).join("\n"));
  process.exit(1);
}
console.log(`ok: ${allItems.length} items across ${trip.days.length} days`);
