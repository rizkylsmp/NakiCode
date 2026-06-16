export type HealthState = {
  status: string;
  service: string;
  database: {
    status: string;
    message?: string;
  };
};

export type TemplateCategory = string;

export type TemplatePreviewItem = {
  image: string;
  caption: string;
};

export type TemplateReviewItem = {
  id: number;
  templateId: number;
  customerName: string;
  rating: number;
  message: string;
  createdAt: string;
};

export type TemplateItem = {
  id: number;
  slug: string;
  title: string;
  category: string;
  description: string;
  price: string;
  stack: string[];
  level: string;
  rating: number;
  accentClass: string;
  preview: TemplatePreviewItem[];
  demoUrl: string;
  buyerCount: number;
  features: string[];
  includedFiles: string[];
  suitableFor: string[];
  license: string;
  support: string;
  reviews: TemplateReviewItem[];
};

export type ServiceItem = {
  title: string;
  description: string;
  points: string[];
};

export type PortfolioItem = {
  id?: number;
  title: string;
  category: string;
  description: string;
  result: string;
  websiteUrl?: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  createdAt?: string;
};

export type ArticleItem = {
  title: string;
  description: string;
  readTime: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export function getTemplateBySlug(templates: TemplateItem[], slug?: string) {
  if (!slug) {
    return undefined;
  }

  return templates.find(
    (template) => template.slug === slug || String(template.id) === slug,
  );
}

export const services: ServiceItem[] = [
  {
    title: "Template Website",
    description:
      "Source code siap edit untuk kebutuhan cepat tanpa mulai dari layar kosong.",
    points: ["React/Vite", "Responsive", "Dokumentasi setup"],
  },
  {
    title: "Pesanan Custom",
    description:
      "Bangun flow spesifik seperti checkout, CRUD, form order, atau integrasi API.",
    points: ["Brief project", "Estimasi scope", "Revisi terarah"],
  },
  {
    title: "Integrasi Backend",
    description:
      "Sambungkan UI template ke Express, MySQL, autentikasi, dan endpoint produksi.",
    points: ["REST API", "MySQL schema", "Admin panel"],
  },
];

export const portfolioItems: PortfolioItem[] = [
  {
    title: "Topup voucher game",
    category: "Top up games",
    description: "Flow pilih game, nominal, kontak, dan status pembayaran.",
    result: "Checkout lebih ringkas",
  },
  {
    title: "Katalog brand lokal",
    category: "E-commerce",
    description:
      "Storefront produk dengan filter, cart drawer, dan order via WhatsApp.",
    result: "Siap untuk UMKM",
  },
  {
    title: "Portfolio developer",
    category: "Portfolio",
    description: "Personal site dengan studi kasus, CV, dan form kontak.",
    result: "Lebih mudah dilamar client",
  },
];

export const articles: ArticleItem[] = [
  {
    title: "Cara install template React Vite dari Naki Code",
    description:
      "Langkah setup dependency, env, dan menjalankan project lokal.",
    readTime: "5 menit",
  },
  {
    title: "Checklist sebelum membeli source code template",
    description:
      "Apa saja yang harus dicek: stack, lisensi, fitur, dan support.",
    readTime: "7 menit",
  },
  {
    title: "Membuat website top up games yang mudah dipakai",
    description:
      "Struktur halaman, nominal, invoice, dan flow order yang jelas.",
    readTime: "6 menit",
  },
];

export const faqs: FaqItem[] = [
  {
    question: "Apa yang didapat setelah membeli template?",
    answer:
      "User mendapatkan source code, panduan setup, dan struktur file yang siap diedit sesuai kebutuhan project.",
  },
  {
    question: "Apakah template bisa dipakai untuk client?",
    answer:
      "Bisa, selama mengikuti lisensi pembelian. Untuk redistribusi template mentah, perlu izin terpisah.",
  },
  {
    question: "Apakah bisa request custom?",
    answer:
      "Bisa. Pilih template dasar atau kirim brief, lalu scope dan estimasi akan dibahas lewat konsultasi.",
  },
  {
    question: "Apakah Naki Code menyediakan domain?",
    answer:
      "Tidak. Fokus Naki Code adalah template, source code, custom website, dan integrasi backend.",
  },
];

export const workflow = [
  "Pilih template atau layanan",
  "Lihat demo dan cocokkan fitur",
  "Beli source code atau request custom",
];
