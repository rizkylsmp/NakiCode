type NicheRule = { name: string; keywords: RegExp };

// Only use the researched business category. Drafts and opportunities can
// mention other industries and are not evidence of the prospect's services.
const rules: NicheRule[] = [
  { name: "Laundry", keywords: /\b(laundry|binatu|dry cleaning)\b/i },
  { name: "Ekspedisi (Courier/Shipping)", keywords: /\b(ekspedisi|expedisi|courier|shipping|cargo|kargo|logistik|logistics|kurir|freight|pengiriman barang|jasa pengiriman)\b/i },
  { name: "Interior & Arsitektur", keywords: /\b(interior|furniture|furnitur|arsitektur|arsitek|architecture)\b/i },
  { name: "Training & Pendidikan", keywords: /\b(training|pelatihan|coaching|pendidikan|sekolah|kursus|bimbel|academy|education|learning)\b/i },
  { name: "Otomotif", keywords: /\b(otomotif|automotive|bengkel|pencucian mobil|cuci mobil|car wash|detailing|pencucian motor|cuci motor)\b/i },
  { name: "Kuliner", keywords: /\b(restoran|restaurant|kuliner|kafe|cafe|coffee|bakery|catering|katering|rumah makan|warung makan)\b/i },
  { name: "Kesehatan", keywords: /\b(klinik|clinic|rumah sakit|hospital|dokter|apotek|pharmacy|dental)\b/i },
  { name: "Kecantikan", keywords: /\b(salon|barbershop|beauty|spa|kecantikan)\b/i },
  { name: "Penginapan & Wisata", keywords: /\b(hotel|villa|vila|homestay|penginapan|wisata|tour|travel agency)\b/i },
  { name: "Retail & E-commerce", keywords: /\b(retail|ritel|e-commerce|toko|boutique|butik)\b/i },
  { name: "Industri & Manufaktur", keywords: /\b(manufaktur|manufacturing|pabrik|factory|industri)\b/i },
  { name: "Properti", keywords: /\b(properti|property|real estate|agen rumah)\b/i },
];

export function getOutreachNiche(category: string): string | null {
  const matches = rules.filter(rule => rule.keywords.test(category));
  if (matches.length === 1) return matches[0].name;
  // Construction is secondary to an explicit interior/architecture category.
  if (!matches.length && /\b(konstruksi|construction|kontraktor|renovasi)\b/i.test(category)) return "Konstruksi";
  return null;
}

export function matchRegisteredNiche(label: string | null, niches: Array<{ name: string }>) {
  if (!label) return null;
  const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const exact = niches.find(niche => normalize(niche.name) === normalize(label));
  if (exact) return exact.name;
  const aliases: Record<string, string[]> = {
    Laundry: ["Binatu"],
    "Ekspedisi (Courier/Shipping)": ["Ekspedisi", "Courier/Shipping", "Courier & Shipping", "Shipping", "Logistik"],
    "Interior & Arsitektur": ["Interior", "Arsitektur"],
    "Training & Pendidikan": ["Training", "Pelatihan", "Pendidikan"],
    Otomotif: ["Automotive"],
    Kuliner: ["Food & Beverage", "F&B"],
    "Retail & E-commerce": ["Retail", "E-commerce", "Ecommerce"],
    "Industri & Manufaktur": ["Industri", "Manufaktur"],
    Konstruksi: ["Construction"],
  };
  const candidates = niches.filter(niche => (aliases[label] ?? []).some(alias => normalize(alias) === normalize(niche.name)));
  // Do not choose arbitrarily between multiple registered sub-niches.
  return candidates.length === 1 ? candidates[0].name : null;
}
