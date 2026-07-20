# THE CORE — ระบบจัดการสต็อกและจัดซื้อกลาง (หลายฟาร์ม)

เว็บแอปสำหรับจัดการสต็อก 3 กลุ่ม (ยา / ก่อสร้าง / โรงงานอาหารสัตว์) ของหลายฟาร์ม
พร้อมระบบจัดซื้อกลางที่ต้องผ่านการอนุมัติจากเจ้าของ

## เทคโนโลยี
- Frontend: HTML/CSS/JavaScript ล้วน (ไม่ต้อง build) + `@supabase/supabase-js` ผ่าน CDN
- Backend: Supabase (Postgres + Auth + Storage + RLS)
- Hosting: GitHub Pages (ไฟล์ static)

## บทบาทผู้ใช้ (role)
- **เจ้าของ (owner)** — อนุมัติ/ปฏิเสธใบขอซื้อได้ (คนเดียวที่มีสิทธิ์นี้) เห็นทุกฟาร์ม
- **เสมียนส่วนกลาง (central_clerk)** — ดูแลราคา/ผู้ขาย/สั่งซื้อ เห็นทุกฟาร์ม แต่อนุมัติไม่ได้
- **เสมียนประจำฟาร์ม (farm_clerk)** — เห็น/บันทึกเฉพาะฟาร์ม+หมวดที่ตัวเองดูแล

การควบคุมสิทธิ์บังคับใช้ที่ระดับฐานข้อมูลด้วย Row Level Security (RLS) และ trigger

## หน้าเว็บ
- `index.html` — เข้าสู่ระบบ
- `dashboard.html` — สรุปภาพรวม
- `stock.html` / `stock-item.html` — คลังสินค้า + บันทึกรับ-จ่าย (บังคับแนบรูป)
- `purchase-request.html` — ใบขอซื้อ + workflow อนุมัติ
- `suppliers.html` — ผู้ขาย + ประวัติราคา
- `jobs.html` / `vouchers.html` — ใบส่งงานช่าง + ใบสำคัญจ่าย
- `settings.html` — จัดการผู้ใช้ (เจ้าของเท่านั้น)

## การเพิ่มผู้ใช้ใหม่
1. Supabase Dashboard → Authentication → Users → Add user (ใส่อีเมล+รหัสผ่าน)
2. คัดลอก User UID
3. เข้าหน้า "ตั้งค่า/ผู้ใช้" ในระบบ → กรอก UID + กำหนดบทบาท/ฟาร์ม/หมวด

## หมายเหตุ
Supabase publishable key ที่ฝังในโค้ดเป็น public key โดยการออกแบบ (ปลอดภัยด้วย RLS)
