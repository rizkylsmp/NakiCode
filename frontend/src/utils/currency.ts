export function formatRupiahInputPreview(value: string | number) {
  return formatRupiahText(value, "");
}

/** Parse legacy catalog values such as `Rp149K` as well as plain integers. */
export function parseRupiahAmount(value: string | number) {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) ? value : null;
  }

  const input = value
    .trim()
    .toLowerCase()
    .replace(/^rp\.?\s*/i, "")
    .replace(/(?:,-|\.-)$/, "");
  if (!input) return null;
  const shorthand = input.match(
    /^(-?[\d]+(?:[.,][\d]+)?)\s*(k|rb|ribu|jt|juta|m|miliar)$/i,
  );
  if (shorthand) {
    const base = Number(shorthand[1].replace(",", "."));
    const multiplier = ["k", "rb", "ribu"].includes(shorthand[2])
      ? 1_000
      : ["m", "miliar"].includes(shorthand[2])
        ? 1_000_000_000
        : 1_000_000;
    const amount = Math.round(base * multiplier);
    return Number.isSafeInteger(amount) ? amount : null;
  }

  if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(input)) return null;
  const amount = Number(input.replace(/\./g, ""));
  return Number.isSafeInteger(amount) ? amount : null;
}

export function formatRupiahText(
  value: string | number,
  fallback = typeof value === "string" && value.trim()
    ? value.trim()
    : "Belum ditentukan",
) {
  const amount = parseRupiahAmount(value);
  return amount === null ? fallback : `Rp. ${amount.toLocaleString("id-ID")},-`;
}
