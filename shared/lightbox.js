// Shared full-screen image viewer (lightbox).
// Usage: openLightbox(arrayOfImageUrls, startIndex)
(function () {
  let urls = [], idx = 0, overlay = null;

  const CSS = `
    #lb-overlay { position:fixed; inset:0; background:rgba(0,0,0,.93); z-index:99999; display:none; flex-direction:column; }
    #lb-overlay .lb-bar { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; }
    #lb-overlay .lb-back { background:#fff; color:#222; border:none; border-radius:6px; padding:9px 18px; font-size:15px; font-weight:bold; cursor:pointer; font-family:inherit; }
    #lb-overlay .lb-back:hover { background:#eee; }
    #lb-overlay .lb-count { color:#fff; font-size:15px; }
    #lb-overlay .lb-stage { flex:1; display:flex; align-items:center; justify-content:center; overflow:auto; padding:0 8px; min-height:0; }
    #lb-overlay .lb-stage img { max-width:94vw; max-height:78vh; object-fit:contain; border-radius:4px; background:#fff; }
    #lb-overlay .lb-nav { position:absolute; top:44%; transform:translateY(-50%); background:rgba(255,255,255,.16); color:#fff; border:none; width:54px; height:74px; font-size:42px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center; }
    #lb-overlay .lb-nav:hover { background:rgba(255,255,255,.32); }
    #lb-overlay .lb-prev { left:0; border-radius:0 10px 10px 0; }
    #lb-overlay .lb-next { right:0; border-radius:10px 0 0 10px; }
    #lb-overlay .lb-strip { display:flex; gap:8px; overflow-x:auto; padding:10px 16px; background:rgba(0,0,0,.45); }
    #lb-overlay .lb-strip img { height:64px; width:64px; object-fit:cover; border-radius:5px; border:2px solid transparent; cursor:pointer; opacity:.55; flex:0 0 auto; }
    #lb-overlay .lb-strip img.active { border-color:#1d9e75; opacity:1; }
    @media (max-width:700px){ #lb-overlay .lb-stage img { max-height:68vh; } #lb-overlay .lb-nav { width:42px; height:60px; font-size:32px; } }
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
        <div class="lb-count" id="lb-count"></div>
        <div style="width:88px;"></div>
      </div>
      <button class="lb-nav lb-prev" id="lb-prev">‹</button>
      <div class="lb-stage" id="lb-stage"><img id="lb-img" alt="เอกสารแนบ"></div>
      <button class="lb-nav lb-next" id="lb-next">›</button>
      <div class="lb-strip" id="lb-strip"></div>`;
    document.body.appendChild(overlay);

    overlay.querySelector("#lb-back").onclick = close;
    overlay.querySelector("#lb-prev").onclick = (e) => { e.stopPropagation(); go(idx - 1); };
    overlay.querySelector("#lb-next").onclick = (e) => { e.stopPropagation(); go(idx + 1); };
    overlay.querySelector("#lb-stage").onclick = (e) => { if (e.target.id === "lb-stage") close(); };
    document.addEventListener("keydown", onKey);
  }

  function onKey(e) {
    if (!overlay || overlay.style.display === "none") return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") go(idx - 1);
    else if (e.key === "ArrowRight") go(idx + 1);
  }

  function go(i) {
    if (!urls.length) return;
    if (i < 0) i = urls.length - 1;
    if (i >= urls.length) i = 0;
    idx = i;
    overlay.querySelector("#lb-img").src = urls[idx];
    overlay.querySelector("#lb-count").textContent = (idx + 1) + " / " + urls.length;
    const thumbs = overlay.querySelectorAll(".lb-strip img");
    thumbs.forEach((t, k) => t.classList.toggle("active", k === idx));
    if (thumbs[idx]) thumbs[idx].scrollIntoView({ inline: "center", block: "nearest" });
  }

  function renderStrip() {
    const strip = overlay.querySelector("#lb-strip");
    strip.style.display = urls.length > 1 ? "flex" : "none";
    strip.innerHTML = urls.map((u, k) => `<img src="${u}" data-k="${k}">`).join("");
    strip.querySelectorAll("img").forEach(t => t.onclick = (e) => { e.stopPropagation(); go(+t.dataset.k); });
    const showNav = urls.length > 1 ? "flex" : "none";
    overlay.querySelector("#lb-prev").style.display = showNav;
    overlay.querySelector("#lb-next").style.display = showNav;
  }

  function open(list, start) {
    if (!overlay) build();
    urls = (list || []).filter(Boolean);
    if (!urls.length) return;
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
    renderStrip();
    go(start || 0);
  }

  function close() {
    if (overlay) overlay.style.display = "none";
    document.body.style.overflow = "";
  }

  window.openLightbox = open;
  window.closeLightbox = close;
})();
