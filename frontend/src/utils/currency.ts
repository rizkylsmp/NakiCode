export function formatRupiahInputPreview(value: string | number) {
  const input = String(value).trim().replace(/^Rp\.?\s*/i, "");
  if (input && !/^[\d.\s]+$/.test(input)) return "";

  const digits = input.replace(/\D/g, "");
  if (!digits) return "";

  const amount = Number(digits);
  if (!Number.isSafeInteger(amount)) return "";

  return `Rp. ${amount.toLocaleString("id-ID")},-`;
}
