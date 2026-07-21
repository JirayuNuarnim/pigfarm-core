// Supabase Edge Function: read-quotation
// Deployed to project hdnuiipfrwcggdhsucyp (verify_jwt = true).
// Reads attached quotation images with Anthropic Claude vision and returns structured
// { results: [{ path, vendor, items:[{name,size,qty,unit,unit_price}] }] } for price comparison.
// Requires secret ANTHROPIC_API_KEY (optional ANTHROPIC_MODEL, default claude-sonnet-5).
// This file is the version-controlled source; deployment is done via the Supabase MCP / CLI.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MEDIA: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
};

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, "content-type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ error: "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY ในระบบ (ผู้ดูแลต้องตั้งค่า secret ก่อน)" }, 500);
    const model = Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-5";

    const { paths } = await req.json();
    if (!Array.isArray(paths) || paths.length === 0) return json({ error: "ไม่มีรูปให้อ่าน" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const prompt = `นี่คือรูปใบเสนอราคา/ใบเทียบราคาสินค้า (ส่วนใหญ่ภาษาไทย). อ่านให้ละเอียดแล้วดึงข้อมูลออกมาเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอก JSON. รูปแบบ:\n{"vendor": "ชื่อร้าน/บริษัทผู้เสนอราคา หรือ null", "items": [{"name": "ชื่อสินค้า", "size": "ขนาด/สเปค หรือ null", "qty": จำนวนเป็นตัวเลข หรือ null, "unit": "หน่วย หรือ null", "unit_price": ราคาต่อหน่วยเป็นตัวเลข หรือ null}]}\nอ่านราคาต่อหน่วยเป็นตัวเลขล้วน (ไม่มีลูกน้ำ/บาท). ถ้าไม่พบข้อมูลให้ใส่ null หรือ []. ตอบเป็น JSON ล้วนๆ.`;

    const results: unknown[] = [];
    for (const path of paths) {
      const ext = (String(path).split(".").pop() || "").toLowerCase();
      const media = MEDIA[ext];
      if (!media) { results.push({ path, error: `ไฟล์ .${ext} ไม่รองรับ (ใช้ jpg/png/webp) — ถ่ายเป็นรูปถ่ายปกติ` }); continue; }

      const { data: blob, error: dlErr } = await supabase.storage.from("ops-attachments").download(path);
      if (dlErr || !blob) { results.push({ path, error: "โหลดรูปจากที่เก็บไม่สำเร็จ" }); continue; }
      const b64 = bytesToBase64(new Uint8Array(await blob.arrayBuffer()));

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model,
          max_tokens: 2000,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: media, data: b64 } },
            { type: "text", text: prompt },
          ] }],
        }),
      });
      if (!resp.ok) { const t = await resp.text(); results.push({ path, error: "AI error: " + t.slice(0, 300) }); continue; }
      const data = await resp.json();
      const text = data?.content?.[0]?.text || "";
      try {
        const s = text.indexOf("{"), e = text.lastIndexOf("}");
        const parsed = JSON.parse(text.slice(s, e + 1));
        results.push({ path, vendor: parsed.vendor ?? null, items: Array.isArray(parsed.items) ? parsed.items : [] });
      } catch (_) {
        results.push({ path, error: "แปลผลจาก AI ไม่สำเร็จ", raw: text.slice(0, 300) });
      }
    }
    return json({ results });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
