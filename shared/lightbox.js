// Shared full-screen image viewer (lightbox) with 1/2/3-up viewing.
// Usage: openLightbox(arrayOfImageUrls, startIndex)
(function () {
  let urls = [], idx = 0, perView = 1, overlay = null;

  const CSS = `
    #lb-overlay { position:fixed; inset:0; background:rgba(0,0,0,.93); z-index:99999; display:none; flex-direction:column; }
    #lb-overlay .lb-bar { display:flex; justify-content:space-between; align-items:center; padding:10px 16px; gap:10px; }
    #lb-overlay .lb-back { background:#fff; color:#222; border:none; border-radius:6px; padding:9px 18px; font-size:15px; font-weight:bold; cursor:pointer; font-family:inherit; }
    #lb-overlay .lb-back:hover { background:#eee; }
    #lb-overlay .lb-center { display:flex; align-items:center; gap:14px; color:#fff; flex-wrap:wrap; justify-content:center; }
    #lb-overlay .lb-count { font-size:15px; }
    #lb-overlay .lb-modes { display:flex; align-items:center; gap:4px; background:rgba(255,255,255,.12); border-radius:8px; padding:3px; }
    #lb-overlay .lb-modes .lb-lbl { font-size:12px; color:#cfd4d0; padding:0 6px; }
    #lb-overlay .lb-modes button { background:transparent; color:#fff; border:none; width:30px; height:28px; border-radius:6px; cursor:pointer; font-size:14px; font-family:inherit; }
    #lb-overlay .lb-modes button.active { background:#1d9e75; font-weight:bold; }
    #lb-overlay .lb-modes button:disabled { opacity:.3; cursor:default; }
    #lb-overlay .lb-stage { flex:1; display:flex; align-items:center; justify-content:center; gap:10px; overflow:auto; padding:0 8px; min-height:0; }
    #lb-overlay .lb-cell { flex:1 1 0; min-width:0; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; }
    #lb-overlay .lb-cell img { max-width:100%; max-height:76vh; object-fit:contain; border-radius:4px; background:#fff; }
    #lb-overlay .lb-cellno { color:#cfd4d0; font-size:12px; }
    #lb-overlay .lb-nav { position:absolute; top:44%; transform:translateY(-50%); background:rgba(255,255,255,.16); color:#fff; border:none; width:54px; height:74px; font-size:42px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center; }
    #lb-overlay .lb-nav:hover { background:rgba(255,255,255,.32); }
    #lb-overlay .lb-prev { left:0; border-radius:0 10px 10px 0; }
    #lb-overlay .lb-next { right:0; border-radius:10px 0 0 10px; }
    #lb-overlay .lb-strip { display:flex; gap:8px; overflow-x:auto; padding:10px 16px; background:rgba(0,0,0,.45); }
    #lb-overlay .lb-strip img { height:64px; width:64px; object-fit:cover; border-radius:5px; border:2px solid transparent; cursor:pointer; opacity:.55; flex:0 0 auto; }
    #lb-overlay .lb-strip img.active { border-color:#1d9e75; opacity:1; }
    @media (max-width:700px){ #lb-overlay .lb-cell img { max-height:66vh; } #lb-overlay .lb-nav { width:42px; height:60px; font-size:32px; } }
  `;

  function build() {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    overlay = document.createElement("div");
    overlay.id = "lb-overlay";
    overlay.innerHTML = `
      <div class="lb-bar">
        <button class="lb-back" id="lb-back">← กลับ</button>
        <div class="lb-center">
          <span class="lb-count" id="lb-count"></span>
          <span class="lb-modes">
            <span class="lb-lbl">แผ่น/จอ</span>
            <button data-pv="1">1</button><button data-pv="2">2</button><button data-pv="3">3</button>
          </span>
        </div>
        <div style="width:88px;"></div>
      </div>
      <button class="lb-nav lb-prev" id="lb-prev">‹</button>
      <div class="lb-stage" id="lb-stage"></div>
      <button class="lb-nav lb-next" id="lb-next">›</button>
      <div class="lb-strip" id="lb-strip"></div>`;
    document.body.appendChild(overlay);

    overlay.querySelector("#lb-back").onclick = close;
    overlay.querySelector("#lb-prev").onclick = (e) => { e.stopPropagation(); go(idx - perView); };
    overlay.querySelector("#lb-next").onclick = (e) => { e.stopPropagation(); go(idx + perView); };
    overlay.querySelector("#lb-stage").onclick = (e) => { if (e.target.id === "lb-stage") close(); };
    overlay.querySelectorAll(".lb-modes button").forEach(b => b.onclick = (e) => { e.stopPropagation(); setPerView(+b.dataset.pv); });
    document.addEventListener("keydown", onKey);
  }

  function onKey(e) {
    if (!overlay || overlay.style.display === "none") return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") go(idx - perView);
    else if (e.key === "ArrowRight") go(idx + perView);
  }

  function lastStart() {
    return Math.max(0, (Math.ceil(urls.length / perView) - 1) * perView);
  }

  function setPerView(pv) {
    perView = Math.min(pv, Math.max(1, urls.length));
    overlay.querySelectorAll(".lb-modes button").forEach(b => {
      const v = +b.dataset.pv;
      b.classList.toggle("active", v === perView);
      b.disabled = v > urls.length;
    });
    go(Math.floor(idx / perView) * perView);
  }

  function go(first) {
    if (!urls.length) return;
    first = Math.floor(first / perView) * perView;   // align to page boundary
    const ls = lastStart();
    if (first < 0) first = ls;
    if (first > ls) first = 0;
    idx = first;

    // stage: render up to perView images
    const end = Math.min(idx + perView, urls.length);
    let html = "";
    for (let k = idx; k < end; k++) {
      html += `<div class="lb-cell"><img src="${urls[k]}" alt="เอกสาร ${k + 1}"><div class="lb-cellno">แผ่นที่ ${k + 1}</div></div>`;
    }
    overlay.querySelector("#lb-stage").innerHTML = html;

    // counter
    overlay.querySelector("#lb-count").textContent =
      perView === 1 ? `${idx + 1} / ${urls.length}` : `${idx + 1}-${end} / ${urls.length}`;

    // strip highlight (all currently-visible)
    overlay.querySelectorAll(".lb-strip img").forEach((t, k) => t.classList.toggle("active", k >= idx && k < end));
    const firstThumb = overlay.querySelector(".lb-strip img.active");
    if (firstThumb) firstThumb.scrollIntoView({ inline: "center", block: "nearest" });

    const showNav = urls.length > perView ? "flex" : "none";
    overlay.querySelector("#lb-prev").style.display = showNav;
    overlay.querySelector("#lb-next").style.display = showNav;
  }

  function renderStrip() {
    const strip = overlay.querySelector("#lb-strip");
    strip.style.display = urls.length > 1 ? "flex" : "none";
    strip.innerHTML = urls.map((u, k) => `<img src="${u}" data-k="${k}">`).join("");
    strip.querySelectorAll("img").forEach(t => t.onclick = (e) => { e.stopPropagation(); go(+t.dataset.k); });
  }

  function open(list, start) {
    if (!overlay) build();
    urls = (list || []).filter(Boolean);
    if (!urls.length) return;
    perView = 1;
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
    renderStrip();
    setPerView(1);
    go(start || 0);
  }

  function close() {
    if (overlay) overlay.style.display = "none";
    document.body.style.overflow = "";
  }

  window.openLightbox = open;
  window.closeLightbox = close;
})();
