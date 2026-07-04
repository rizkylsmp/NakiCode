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
  lynkUrl?: string | null;
  buyerCount: number;
  features: string[];
  includedFiles: string[];
  sourceCode: string[];
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
  coverIndex?: number;
  createdAt?: string;
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
    title: "Design Website",
    description:
      "Pilih design referensi sebagai titik awal, lalu kami sesuaikan tampilan, konten, dan fiturnya untuk bisnismu.",
    points: ["Design siap edit", "Responsive", "Revisi terarah"],
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
      "Sambungkan design pilihan ke Express, MySQL, autentikasi, dan endpoint produksi.",
    points: ["REST API", "MySQL schema", "Admin panel"],
  },
];

export const faqs: FaqItem[] = [
  {
    question: "Apa yang didapat saat memilih design?",
    answer:
      "Design menjadi referensi awal untuk website yang kami kerjakan. Tampilan, konten, warna, dan fitur dapat disesuaikan. Source code juga bisa dibeli jika dibutuhkan.",
  },
  {
    question: "Apakah design bisa disesuaikan untuk brand atau client?",
    answer:
      "Bisa. Design dapat disesuaikan dengan identitas brand, kebutuhan bisnis, konten, dan alur pengguna masing-masing project.",
  },
  {
    question: "Apakah bisa request custom?",
    answer:
      "Bisa. Pilih design yang paling mendekati kebutuhanmu atau kirim brief dari awal, lalu scope dan estimasi dibahas lewat konsultasi.",
  },
  {
    question: "Apakah Naki Code menyediakan domain?",
    answer:
      "Belum termasuk secara default. Fokus Naki Code adalah jasa pembuatan website, design siap edit, source code, dan integrasi backend.",
  },
];

export const workflow = [
  "Pilih design sebagai referensi",
  "Diskusikan penyesuaian dan fitur",
  "Kami kerjakan website atau kirim source code",
];
