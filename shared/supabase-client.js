const SUPABASE_URL = "https://hdnuiipfrwcggdhsucyp.supabase.co";
const SUPABASE_KEY = "sb_publishable_08HO-fBjfWEN_XNTFEp6ow_9JJzZSj9";

// app icon (favicon) for every page + the standalone app window
(function () {
  if (!document.querySelector('link[rel="icon"]')) {
    const l = document.createElement("link");
    l.rel = "icon"; l.href = "favicon.ico";
    document.head.appendChild(l);
  }
  // warm up the connection to Supabase so the first data/storage call is faster
  for (const rel of ["preconnect", "dns-prefetch"]) {
    const p = document.createElement("link");
    p.rel = rel; p.href = SUPABASE_URL; p.crossOrigin = "anonymous";
    document.head.appendChild(p);
  }

  // PWA: installable app + standalone window + theme color
  if (!document.querySelector('link[rel="manifest"]')) {
    const m = document.createElement("link");
    m.rel = "manifest"; m.href = "manifest.json";
    document.head.appendChild(m);
  }
  if (!document.querySelector('meta[name="theme-color"]')) {
    const t = document.createElement("meta");
    t.name = "theme-color"; t.content = "#0b1120";
    document.head.appendChild(t);
  }
  const at = document.createElement("link");
  at.rel = "apple-touch-icon"; at.href = "icon-192.png";
  document.head.appendChild(at);
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
  }
})();

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const DOMAIN_LABELS = {
  medicine: "ยา",
  construction: "ก่อสร้าง",
  feedmill: "โรงงานอาหาร",
};

const STATUS_BADGE_CLASS = {
  "รอเสมียนกลาง": "warn",
  "รออนุมัติเจ้าของ": "warn",
  "อนุมัติแล้ว": "ok",
  "สั่งซื้อแล้ว": "ok",
  "รับของแล้ว": "ok",
  "ปฏิเสธ": "danger",
  "สั่งเองไม่ผ่านอนุมัติ": "danger",
  "รอตรวจ": "warn",
  "จ่ายแล้ว": "ok",
  "ร่าง": "",
  "พิมพ์แล้ว": "ok",
};

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatNumber(n, digits = 2) {
  const num = Number(n) || 0;
  return num.toLocaleString("th-TH", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function todayISO() {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}
