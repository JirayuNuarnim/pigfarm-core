let CURRENT_USER = null;

// ==== โหมดพัฒนา: ล็อกอินอัตโนมัติ (ปิดหน้าล็อกอินชั่วคราว) ====
// ตั้งเป็น false เพื่อกลับมาใช้ระบบล็อกอินปกติก่อนใช้งานจริง
const DEV_AUTOLOGIN = true;
const DEV_AUTOLOGIN_EMAIL = "eatgreendrinkclean@gmail.com";
const DEV_AUTOLOGIN_PASSWORD = "TestPassword123!";

const ROLE_LABELS = {
  owner: "เจ้าของ",
  central_clerk: "เสมียนส่วนกลาง",
  farm_clerk: "เสมียนประจำฟาร์ม",
};

async function requireAuth() {
  let { data: { session } } = await sb.auth.getSession();
  if (!session && DEV_AUTOLOGIN) {
    await sb.auth.signInWithPassword({ email: DEV_AUTOLOGIN_EMAIL, password: DEV_AUTOLOGIN_PASSWORD });
    ({ data: { session } } = await sb.auth.getSession());
  }
  if (!session) {
    window.location.href = "index.html";
    return null;
  }
  const { data: userRow, error } = await sb
    .from("ops_users")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error || !userRow || !userRow.active) {
    await sb.auth.signOut();
    alert("บัญชีนี้ยังไม่ได้รับสิทธิ์เข้าใช้งานระบบ กรุณาติดต่อผู้ดูแลระบบ");
    window.location.href = "index.html";
    return null;
  }
  CURRENT_USER = userRow;
  CURRENT_USER.email = session.user.email;
  renderNav();
  return CURRENT_USER;
}

function requireRole(allowedRoles) {
  if (!CURRENT_USER || !allowedRoles.includes(CURRENT_USER.role)) {
    document.body.innerHTML = '<div class="content"><div class="card"><h1>ไม่มีสิทธิ์เข้าถึงหน้านี้</h1><p><a class="link" href="dashboard.html">กลับหน้าแรก</a></p></div></div>';
    return false;
  }
  return true;
}

function isOwner() { return !!CURRENT_USER && CURRENT_USER.role === "owner"; }
function isCentral() { return !!CURRENT_USER && CURRENT_USER.role === "central_clerk"; }
function isFarmClerk() { return !!CURRENT_USER && CURRENT_USER.role === "farm_clerk"; }
function canSeeAllFarms() { return isOwner() || isCentral(); }
function myFarms() { return CURRENT_USER ? (CURRENT_USER.farms || []) : []; }
function myDomains() { return CURRENT_USER ? (CURRENT_USER.domains || []) : []; }

function renderNav() {
  const el = document.getElementById("nav-root");
  if (!el || !CURRENT_USER) return;
  const roleLabel = ROLE_LABELS[CURRENT_USER.role] || "";
  let links = `
    <a href="dashboard.html">หน้าแรก</a>
    <a href="stock.html">คลังสินค้า / Stock</a>
    <a href="purchase-request.html">ใบขอซื้อ / อนุมัติ</a>
    <a href="jobs.html">ใบส่งงานช่าง</a>
    <a href="vouchers.html">ใบสำคัญรับ/จ่ายเงิน</a>
  `;
  if (isOwner() || isCentral()) {
    links += `<a href="suppliers.html">ผู้ขาย/ประวัติราคา</a>`;
  }
  if (isOwner()) {
    links += `<a href="settings.html">ตั้งค่า/ผู้ใช้</a>`;
  }
  el.innerHTML = `
    <div class="brand">🌾 THE CORE</div>
    <div class="user-chip">${escapeHtml(CURRENT_USER.name || CURRENT_USER.email)}<div class="muted" style="font-size:12px;">${roleLabel}</div></div>
    ${links}
    <a href="#" id="logout-link">ออกจากระบบ</a>
  `;
  const highlight = document.body.dataset.page;
  if (highlight) {
    const active = el.querySelector(`a[href="${highlight}.html"]`);
    if (active) active.classList.add("active");
  }
  document.getElementById("logout-link").addEventListener("click", async (e) => {
    e.preventDefault();
    await sb.auth.signOut();
    window.location.href = "index.html";
  });
}
