export function formatDateIN(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-IN"); // DD/MM/YYYY
  } catch {
    return String(value);
  }
}

export function isoToIN(iso) {
  // iso: YYYY-MM-DD
  if (!iso) return "";
  const [y, m, d] = String(iso).split("-");
  if (!y || !m || !d) return String(iso);
  return `${d}/${m}/${y}`;
}

export function inToIso(inDate) {
  // inDate: DD/MM/YYYY
  if (!inDate) return "";
  const parts = String(inDate).trim().split("/");
  if (parts.length !== 3) return "";
  const [d, m, y] = parts;
  if (!y || !m || !d) return "";
  if (y.length !== 4) return "";
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}
