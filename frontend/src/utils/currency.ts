export function formatRupiahInputPreview(value: string | number) {
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";

  const amount = Number(digits);
  if (!Number.isSafeInteger(amount)) return "";

  return `Rp. ${amount.toLocaleString("id-ID")},-`;
}
