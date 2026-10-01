type WhatsAppLead = {
  status: string;
  whatsapp_number: string | null;
  opt_in_at: string | null;
  opt_in_source: string | null;
};

export function getOutreachWhatsAppLink(lead: WhatsAppLead, draft: string) {
  if (lead.status === "ready") {
    return { href: null, reason: "Pilih status Ditinjau dan simpan untuk memakai alur manual tanpa antrean Cloud API." };
  }
  if (["do_not_contact", "sending", "lost", "won"].includes(lead.status)) {
    return { href: null, reason: "Status prospek ini tidak mengizinkan kontak WhatsApp." };
  }
  const number = lead.whatsapp_number?.replace(/^\+/, "") ?? "";
  const consentTime = Date.parse(lead.opt_in_at ?? "");
  let validSource = false;
  try {
    validSource = ["https:", "http:"].includes(new URL(lead.opt_in_source ?? "").protocol);
  } catch { /* Missing or invalid consent source. */ }
  if (!/^[1-9]\d{7,14}$/.test(number) || !Number.isFinite(consentTime) || consentTime > Date.now() || !validSource) {
    return { href: null, reason: "Simpan nomor, waktu, dan URL bukti persetujuan WhatsApp yang valid terlebih dahulu." };
  }
  const text = draft.trim();
  if (text.length < 10 || text.length > 3000) {
    return { href: null, reason: "Draf pesan harus berisi 10–3000 karakter." };
  }
  return { href: `https://wa.me/${number}?text=${encodeURIComponent(text)}`, reason: null };
}
