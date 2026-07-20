const TH_DIGITS = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const TH_UNITS = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

function readSixDigitGroup(num) {
  if (num === 0) return "";
  const s = String(num);
  const n = s.length;
  let result = "";
  for (let i = 0; i < n; i++) {
    const digit = parseInt(s[i], 10);
    const pos = n - i - 1;
    if (digit === 0) continue;
    if (pos === 0) {
      result += digit === 1 && n > 1 ? "เอ็ด" : TH_DIGITS[digit];
    } else if (pos === 1) {
      if (digit === 1) result += "สิบ";
      else if (digit === 2) result += "ยี่สิบ";
      else result += TH_DIGITS[digit] + "สิบ";
    } else {
      result += TH_DIGITS[digit] + TH_UNITS[pos];
    }
  }
  return result;
}

function readInteger(n) {
  if (n === 0) return "ศูนย์";
  const groups = [];
  while (n > 0) {
    groups.push(n % 1000000);
    n = Math.floor(n / 1000000);
  }
  groups.reverse();
  const parts = groups.map(readSixDigitGroup);
  let text = "";
  parts.forEach((part, i) => {
    const isLast = i === parts.length - 1;
    if (part === "" && !isLast) return;
    text += part;
    if (!isLast) text += "ล้าน";
  });
  return text;
}

function numberToThaiText(amount) {
  amount = Math.round((Number(amount) + 1e-9) * 100) / 100;
  const baht = Math.floor(amount);
  const satang = Math.round((amount - baht) * 100);
  let text = readInteger(baht) + "บาท";
  if (satang === 0) {
    text += "ถ้วน";
  } else {
    text += readInteger(satang) + "สตางค์";
  }
  return text;
}
