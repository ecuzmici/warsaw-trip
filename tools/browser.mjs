let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("browser checks need playwright:\n  npm install\n  npx playwright install chromium");
  process.exit(1);
}

// Browser checks the node gate cannot make: rendered contrast, real tap-target
// boxes, runtime errors, and the disclosure state surviving a clock tick.
// Run with: npm run check:browser  (needs npx playwright install chromium)
const URL = "file:///home/emil/code/warsaw-trip/docs/index.html";

const AUDIT = () => {
  const lum = (c) => { const s = c.map(v => { v /= 255; return v <= .03928 ? v/12.92 : ((v+.055)/1.055)**2.4; }); return .2126*s[0]+.7152*s[1]+.0722*s[2]; };
  const parse = (s) => { const m = s.match(/[\d.]+/g); return m ? m.slice(0,3).map(Number).concat(m[3] !== undefined ? +m[3] : 1) : null; };
  const over = (fg, bg) => fg.slice(0,3).map((v,i) => v*fg[3] + bg[i]*(1-fg[3]));
  const bgOf = (el) => { let n = el; while (n && n !== document.documentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c[3] > 0) return over(c, [255,255,255]); n = n.parentElement; } const c = parse(getComputedStyle(document.body).backgroundColor); return c ? over(c,[255,255,255]) : [255,255,255]; };
  const ratio = (a,b) => { const [l,d] = [lum(a), lum(b)].sort((x,y)=>y-x); return (l+.05)/(d+.05); };

  const contrast = [], small = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    const direct = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (direct && r.width && r.height) {
      let op = 1, n = el; while (n && n !== document.documentElement) { op *= +getComputedStyle(n).opacity; n = n.parentElement; }
      const fg = parse(cs.color); const bg = bgOf(el);
      if (fg) {
        const eff = over([fg[0],fg[1],fg[2], fg[3]*op], bg);
        const px = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
        const need = (px >= 24 || (px >= 18.66 && bold)) ? 3 : 4.5;
        const got = ratio(eff, bg);
        if (got < need) contrast.push({ sel: el.tagName.toLowerCase()+"."+[...el.classList].join("."), text: el.textContent.trim().slice(0,26), px: +px.toFixed(1), ratio: +got.toFixed(2), need });
      }
    }
    if (el.matches("a,button,summary,[role=button]")) {
      if (r.width && r.height && (r.width < 44 || r.height < 44)) small.push({ text: el.textContent.trim().slice(0,26), w: Math.round(r.width), h: Math.round(r.height) });
    }
  }
  return { contrast, small,
    scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth,
    headline: [...document.querySelectorAll("#live .headline")].map(e => e.textContent.trim()),
    maxLiveFont: Math.max(...[...document.querySelectorAll("#live *")].filter(e=>e.textContent.trim()).map(e => parseFloat(getComputedStyle(e).fontSize))),
  };
};

const STATES = [
  ["during", Date.UTC(2026,7,13,8,30)],
  ["late",   Date.UTC(2026,7,13,11,55)],
  ["gap",    Date.UTC(2026,7,13,13,20)],
  ["done",   Date.UTC(2026,7,13,21,30)],
  ["before", Date.UTC(2026,7,12,9,0)],
  ["after",  Date.UTC(2026,7,16,9,0)],
];
console.log("contrast, tap targets, overflow and errors:");
const b = await chromium.launch();
let bad = 0;
for (const [name, ms] of STATES) {
  for (const scheme of ["light","dark"]) {
    for (const [w,h] of [[390,844],[360,640]]) {
      const ctx = await b.newContext({ viewport:{width:w,height:h}, isMobile:true, hasTouch:true, colorScheme: scheme });
      await ctx.addInitScript(`Date.now = () => ${ms};`);
      const p = await ctx.newPage();
      const errs = []; p.on("pageerror", e => errs.push(String(e)));
      await p.goto(URL, { waitUntil: "load" });
      await p.waitForTimeout(250);
      const a = await p.evaluate(AUDIT);
      const flags = [];
      if (a.scrollW !== a.clientW) flags.push(`OVERFLOW ${a.scrollW}/${a.clientW}`);
      if (a.contrast.length) flags.push("CONTRAST " + JSON.stringify(a.contrast));
      if (a.small.length) flags.push("TAP " + JSON.stringify(a.small));
      if (errs.length) flags.push("JS " + errs.join(";"));
      if (flags.length) bad++;
      if (scheme === "light" && w === 390) console.log(`  ${name.padEnd(7)} headline=${JSON.stringify(a.headline)}`);
      if (flags.length) console.log(`  !! ${name}/${scheme}/${w}: ${flags.join(" | ")}`);
      await ctx.close();
    }
  }
}
await b.close();
console.log(bad ? `  ${bad} failing combinations` : "  all 24 combinations clean");
if (bad) process.exitCode = 1;


console.log("\ndisclosures, focus and scroll across a changing schedule:");
{
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.addInitScript(`
  const base = ${Date.UTC(2026, 7, 13, 8, 30)};
  const boot = performance.now();
  Date.now = () => base + (performance.now() - boot) * 200;   // 40s wall ≈ 133 page-minutes
  window.__ticks = 0;
  const si = setInterval;
  setInterval = (fn, ms) => si(() => { window.__ticks++; fn(); }, ms);
`);
const p = await ctx.newPage();
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("file:///home/emil/code/warsaw-trip/docs/index.html", { waitUntil: "load" });

// Open a collapsed day, open a row inside it, open a row in today, focus a link, scroll.
await p.click(".fold summary");                       // Fri 14
await p.click(".fold ol li details summary");         // a row inside Fri 14
await p.click(".day:not(.folded) li details summary");// a row in today
await p.evaluate(() => document.querySelector(".body a.btn").focus());
await p.evaluate(() => window.scrollTo(0, 700));
const snap = () => p.evaluate(() => ({
  open: [...document.querySelectorAll("details")].filter(d => d.open).length,
  focus: document.activeElement?.textContent?.trim().slice(0, 18),
  scroll: Math.round(window.scrollY),
  clock: document.querySelector("#clock").textContent,
  head: document.querySelector("#live .headline")?.textContent,
}));
const before = await snap();
await p.waitForTimeout(40000);
const after = await snap();
after.ticks = await p.evaluate(() => window.__ticks);
console.log("  before:", JSON.stringify(before));
console.log("  after: ", JSON.stringify(after));
const ok = after.ticks >= 2 && after.clock !== before.clock && after.head !== before.head &&
           after.open === before.open && before.open === 3 &&
           after.focus === before.focus && Math.abs(after.scroll - before.scroll) <= 2 && !errs.length;
console.log("  " + (errs.length ? "JS ERRORS: " + errs.join(";") : "no js errors"));
console.log("  " + (ok ? "PASS: 3 nested disclosures, focus and scroll all survived a changing schedule" : "FAIL"));
await b.close();
if (!ok) process.exitCode = 1;
}
