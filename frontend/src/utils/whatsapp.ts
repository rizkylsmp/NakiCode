export const DEFAULT_WHATSAPP_NUMBER = "6285159734244";

export function normalizeWhatsAppNumber(value?: string): string {
  const number = (value ?? "")
    .trim()
    .replace(/[\s()-]/g, "")
    .replace(/^\+/, "")
    .replace(/^0/, "62");
  return /^[1-9]\d{7,14}$/.test(number) ? number : DEFAULT_WHATSAPP_NUMBER;
}

export function getWhatsAppUrl(message: string): string {
  const number = normalizeWhatsAppNumber(import.meta.env.VITE_WHATSAPP_NUMBER);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
