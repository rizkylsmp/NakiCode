import {
  FileArchive,
  GripVertical,
  ImagePlus,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { useState } from "react";
import type React from "react";
import { apiUpload } from "../../services/api-client";
import {
  type PortfolioItem,
  type TemplateCategory,
  type TemplateItem,
  type TemplatePreviewItem,
} from "../../domain/content";

export type TemplateFormState = {
  id?: number;
  slug: string;
  title: string;
  category: TemplateItem["category"];
  description: string;
  price: string;
  frontendStack: string;
  backendStack: string;
  databaseStack: string;
  level: string;
  accentClass: string;
  preview: TemplatePreviewItem[];
  demoUrl: string;
  lynkUrl: string;
  features: string;
  includedFiles: string;
  sourceCode: string;
  suitableFor: string;
  license: string;
  support: string;
};

export const defaultFormState: TemplateFormState = {
  slug: "",
  title: "",
  category: "Portfolio",
  description: "",
  price: "Rp149K",
  frontendStack: "",
  backendStack: "",
  databaseStack: "",
  level: "Pemula",
  accentClass: "bg-naki-secondary",
  preview: [],
  demoUrl: "#",
  lynkUrl: "",
  features: "",
  includedFiles: "",
  sourceCode: "",
  suitableFor: "",
  license:
    "Boleh dipakai untuk satu personal/client project. Source code tidak boleh dijual ulang tanpa izin.",
  support: "Support setup dasar setelah pembelian.",
};

export type TemplatesResponse = {
  templates: TemplateItem[];
};

export type TemplateMutationResponse = {
  template: TemplateItem;
};

export type ProjectMutationResponse = {
  project: PortfolioItem;
};

export type CategoryMutationResponse = {
  category?: TemplateCategory;
  categories: TemplateCategory[];
  adminCategories?: Array<{ id: number; name: string }>;
  message?: string;
};

export type PortfolioFormState = {
  id?: number;
  title: string;
  category: string;
  description: string;
  result: string;
  websiteUrl: string;
  imageUrl: string;
  imageUrls: string[];
  coverIndex: number;
};

export const defaultPortfolioFormState: PortfolioFormState = {
  title: "",
  category: "Company profile",
  description: "",
  result: "Website selesai",
  websiteUrl: "#",
  imageUrl: "",
  imageUrls: [],
  coverIndex: 0,
};

export type BlogPostFormState = {
  id?: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  coverImage: string;
  status: "draft" | "published";
};

export type BlogPostItem = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  coverImage: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const defaultBlogPostFormState: BlogPostFormState = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  author: "Naki Code",
  coverImage: "",
  status: "draft",
};

export type TestimonialItem = {
  id: number;
  source_type: "manual" | "rating";
  rating_id: number | null;
  customer_name: string;
  customer_role: string | null;
  quote: string;
  rating: number;
  template_id: number | null;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type TestimonialFormState = {
  id?: number;
  customer_name: string;
  customer_role: string;
  quote: string;
  rating: number;
  is_featured: boolean;
  sort_order: number;
};

export const defaultTestimonialFormState: TestimonialFormState = {
  customer_name: "",
  customer_role: "",
  quote: "",
  rating: 5,
  is_featured: true,
  sort_order: 0,
};

export type OrderStatus = "new" | "contacted" | "deal" | "closed";
export type OrderStatusFilter = "all" | OrderStatus;
export type PaymentStatusFilter =
  | "all"
  | "pending"
  | "waiting_payment"
  | "paid"
  | "failed";
export type DashboardView = "dashboard" | "design" | "orders" | "portfolio" | "blog" | "testimonials" | "categories" | "coupons";
export type AdminOrderFilters = {
  status: OrderStatusFilter;
  paymentStatus: PaymentStatusFilter;
};

export type AuthResponse = {
  user: {
    id: number;
    username: string;
    role?: "user" | "admin";
  };
};

export function normalizeCoverIndex(
  coverIndex: number | undefined,
  imageUrls: string[],
) {
  const index = coverIndex ?? 0;

  return Number.isInteger(index) && index >= 0 && index < imageUrls.length
    ? index
    : 0;
}

export function normalizeAdminSection(section: string): DashboardView {
  return section === "design" ||
    section === "orders" ||
    section === "portfolio" ||
    section === "blog" ||
    section === "testimonials" ||
    section === "categories" ||
    section === "coupons"
    ? section
    : "dashboard";
}

export function legacyHashToAdminView(hash: string): DashboardView | null {
  const view = hash.replace("#", "");

  if (view === "templates") return "design";
  return view === "design" || view === "orders" || view === "portfolio" || view === "blog" || view === "testimonials" || view === "categories" || view === "coupons"
    ? view
    : null;
}

export const orderStatusFilters: Array<{
  label: string;
  value: OrderStatusFilter;
}> = [
  { label: "Semua", value: "all" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Deal", value: "deal" },
  { label: "Closed", value: "closed" },
];
export const paymentStatusFilters: Array<{
  label: string;
  value: PaymentStatusFilter;
}> = [
  { label: "Semua bayar", value: "all" },
  { label: "Belum bayar", value: "pending" },
  { label: "Menunggu", value: "waiting_payment" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
];
export const adminOrdersPageSize = 8;
export const adminTemplatesPageSize = 8;
export const adminBlogPostsPageSize = 10;
export const levelOptions = ["Pemula", "Menengah", "Lanjut"];

export const frontendStackOptions = [
  "React",
  "Vue",
  "Angular",
  "Svelte",
  "Next.js",
  "Nuxt",
  "Vite",
  "Tailwind CSS",
  "Bootstrap",
  "Material UI",
  "TypeScript",
  "JavaScript",
  "HTML",
  "CSS",
  "SCSS",
  "Framer Motion",
  "GSAP",
  "Three.js",
  "Chart.js",
  "D3.js",
];

export const backendStackOptions = [
  "Node.js",
  "Express",
  "Fastify",
  "NestJS",
  "Django",
  "Flask",
  "Laravel",
  "Spring Boot",
  "Ruby on Rails",
  "Go",
  "Rust",
  "Python",
  "PHP",
  "Java",
  "REST API",
  "GraphQL",
  "WebSocket",
  "JWT",
  "OAuth",
  "Redis",
];

export const databaseStackOptions = [
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "SQLite",
  "Supabase",
  "Firebase",
  "Prisma",
  "Sequelize",
  "Mongoose",
  "TypeORM",
  "Drizzle",
  "PlanetScale",
  "Neon",
  "Vercel Postgres",
];
export const licenseOptions = [
  "Boleh dipakai untuk satu personal/client project. Source code tidak boleh dijual ulang tanpa izin.",
  "Boleh dipakai untuk satu brand atau satu client project.",
  "Boleh dipakai untuk personal dan client project.",
  "Personal use only.",
];
export const supportOptions = [
  "Support setup dasar selama 7 hari setelah pembelian.",
  "Support setup dasar dan arahan custom ringan.",
  "Support setup dasar dan integrasi API awal.",
  "Tanpa support teknis lanjutan.",
];
export type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  step?: string;
  placeholder?: string;
};

export function Field({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  step,
  placeholder,
}: FieldProps) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-naki-smoke">{label}</span>
      <input
        className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-blue-400"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        placeholder={placeholder}
        step={step}
      />
    </label>
  );
}

export type TextAreaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
};

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  required = false,
}: TextAreaProps) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-naki-smoke">{label}</span>
      <textarea
        className="resize-y rounded-lg border border-naki-steel bg-naki-page-bg px-3 py-2 text-sm text-naki-primary leading-relaxed outline-none transition focus:border-blue-400"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        required={required}
      />
    </label>
  );
}

export type SelectOption = string | { label: string; value: string };

export type SelectFieldProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
};

export function SelectField({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-naki-smoke">{label}</span>
      <select
        className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-blue-400"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => {
          const optionValue =
            typeof option === "string" ? option : option.value;
          const optionLabel =
            typeof option === "string" ? option : option.label;

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}

export type TagSelectorProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

export function TagSelector({
  label,
  options,
  value,
  onChange,
}: TagSelectorProps) {
  const selectedItems = splitLines(value);

  function toggleItem(item: string) {
    const nextItems = selectedItems.includes(item)
      ? selectedItems.filter((selectedItem) => selectedItem !== item)
      : [...selectedItems, item];

    onChange(nextItems.join(", "));
  }

  return (
    <section className="grid gap-2">
      <p className="text-xs font-medium text-naki-smoke uppercase tracking-wide">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedItems.includes(option);

          return (
            <button
              key={option}
              className={`inline-flex h-10 items-center justify-center rounded-xl px-3 text-sm font-medium transition ${
                isSelected
                  ? "bg-naki-primary text-white"
                  : "border border-naki-steel bg-white text-naki-smoke hover:border-naki-primary/40"
              }`}
              onClick={() => toggleItem(option)}
              type="button"
            >
              {option}
            </button>
          );
        })}
      </div>
      <Field
        label="Stack custom"
        value={value}
        onChange={(nextValue) => onChange(splitLines(nextValue).join(", "))}
      />
    </section>
  );
}

export type TagInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function TagInput({ label, value, onChange }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const items = splitLines(value);

  function addDraft() {
    const nextItem = draft.trim();

    if (!nextItem) {
      return;
    }

    onChange(appendLines(value, [nextItem]));
    setDraft("");
  }

  function removeItem(item: string) {
    onChange(items.filter((currentItem) => currentItem !== item).join("\n"));
  }

  return (
    <section className="grid gap-2">
      <p className="text-xs font-medium text-naki-smoke uppercase tracking-wide">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-naki-frost px-3 text-sm font-medium text-naki-primary"
            onClick={() => removeItem(item)}
            type="button"
          >
            {item}
            <X size={14} />
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="h-11 w-full min-w-0 flex-1 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-blue-400"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addDraft();
            }
          }}
          type="text"
        />
        <button
          className="inline-flex h-11 items-center justify-center rounded-xl bg-naki-secondary px-4 text-sm font-medium text-white transition hover:bg-naki-primary"
          onClick={addDraft}
          type="button"
        >
          Tambah
        </button>
      </div>
    </section>
  );
}

export type ImageUploadDropZoneProps = {
  adminToken: string | null;
  title: string;
  description: string;
  status: string;
  multiple?: boolean;
  uploadLabel?: string;
  onStatusChange: (status: string) => void;
  onUploaded: (imageUrls: string[]) => void;
  successMessage: (imageUrls: string[]) => string;
};

export function ImageUploadDropZone({
  adminToken,
  title,
  description,
  status,
  multiple = true,
  uploadLabel = "Upload",
  onStatusChange,
  onUploaded,
  successMessage,
}: ImageUploadDropZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [, setValidationError] = useState<string | null>(null);

  function getImageDimensions(
    file: File,
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () =>
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () =>
        reject(new Error(`Gagal membaca dimensi gambar: ${file.name}`));
      img.src = URL.createObjectURL(file);
    });
  }

  async function addFiles(files: File[]) {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (!imageFiles.length) {
      setValidationError("File yang dipilih bukan gambar.");
      return;
    }

    // File count validation
    if (multiple && imageFiles.length > 12) {
      setValidationError("Maksimal 12 gambar");
      return;
    }

    // File size validation (max 5MB per file)
    const oversizedFile = imageFiles.find(
      (file) => file.size > 5 * 1024 * 1024,
    );
    if (oversizedFile) {
      setValidationError(
        `Ukuran file "${oversizedFile.name}" terlalu besar (maks 5MB)`,
      );
      return;
    }

    // Dimension validation
    const minDim = 200;
    const maxDim = 4000;

    for (const file of imageFiles) {
      try {
        const dims = await getImageDimensions(file);
        if (dims.width < minDim || dims.height < minDim) {
          setValidationError(
            `Gambar "${file.name}" terlalu kecil. Minimum ${minDim}x${minDim} piksel`,
          );
          return;
        }
        if (dims.width > maxDim || dims.height > maxDim) {
          setValidationError(
            `Gambar "${file.name}" terlalu besar. Maksimum ${maxDim}x${maxDim} piksel`,
          );
          return;
        }
      } catch {
        setValidationError(`Gagal membaca dimensi gambar "${file.name}".`);
        return;
      }
    }

    setValidationError(null);

    const selectedFiles = multiple ? imageFiles : imageFiles.slice(0, 1);

    if (!selectedFiles.length) {
      return;
    }

    setIsUploading(true);
    onStatusChange("Mengupload gambar preview...");

    try {
      const imageUrls = await uploadPreviewImages(selectedFiles, adminToken);

      if (imageUrls.length) {
        onUploaded(imageUrls);
        onStatusChange(successMessage(imageUrls));
      }
    } catch {
      onStatusChange("Gagal memproses gambar. Coba file gambar lain.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="grid gap-2">
      <div
        className="rounded-xl border border-dashed border-naki-steel bg-naki-frost p-5 outline-none transition focus:border-blue-400"
        onDrop={(event) => {
          event.preventDefault();

          const files = Array.from(event.dataTransfer.files);

          if (files.length) {
            void addFiles(files);
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onPaste={(event) => {
          void addFiles(Array.from(event.clipboardData.files));
        }}
        tabIndex={0}
      >
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-white text-naki-secondary">
              <ImagePlus size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-naki-primary">{title}</p>
              <p className="mt-1 text-sm text-naki-smoke leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-medium text-white transition hover:opacity-90">
            <UploadCloud size={16} />
            {isUploading ? "Proses..." : uploadLabel}
            <input
              className="sr-only"
              accept="image/*"
              disabled={isUploading}
              multiple={multiple}
              onChange={(event) => {
                void addFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
              type="file"
            />
          </label>
        </div>
      </div>
      <p className="text-sm text-naki-smoke">{status}</p>
    </section>
  );
}

export type PreviewDropZoneProps = {
  adminToken: string | null;
  value: TemplatePreviewItem[];
  onChange: (value: TemplatePreviewItem[]) => void;
};

export function PreviewDropZone({
  adminToken,
  value,
  onChange,
}: PreviewDropZoneProps) {
  const [draggedPreviewIndex, setDraggedPreviewIndex] = useState<number | null>(
    null,
  );
  const [dragOverPreviewIndex, setDragOverPreviewIndex] = useState<
    number | null
  >(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  function getImageDimensions(
    file: File,
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () =>
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () =>
        reject(new Error(`Gagal membaca dimensi gambar: ${file.name}`));
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleUpload(files: File[]) {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (!imageFiles.length) {
      setUploadStatus("File yang dipilih bukan gambar.");
      return;
    }

    if (imageFiles.length > 12) {
      setUploadStatus("Maksimal 12 gambar.");
      return;
    }

    const oversizedFile = imageFiles.find(
      (file) => file.size > 5 * 1024 * 1024,
    );
    if (oversizedFile) {
      setUploadStatus(
        `Ukuran file "${oversizedFile.name}" terlalu besar (maks 5MB).`,
      );
      return;
    }

    const minDim = 200;
    const maxDim = 4000;

    for (const file of imageFiles) {
      try {
        const dims = await getImageDimensions(file);
        if (dims.width < minDim || dims.height < minDim) {
          setUploadStatus(
            `Gambar "${file.name}" terlalu kecil. Minimum ${minDim}x${minDim} piksel.`,
          );
          return;
        }
        if (dims.width > maxDim || dims.height > maxDim) {
          setUploadStatus(
            `Gambar "${file.name}" terlalu besar. Maksimum ${maxDim}x${maxDim} piksel.`,
          );
          return;
        }
      } catch {
        setUploadStatus(`Gagal membaca dimensi gambar "${file.name}".`);
        return;
      }
    }

    setIsUploading(true);
    setUploadStatus("Mengupload gambar...");

    try {
      const imageUrls = await uploadPreviewImages(imageFiles, adminToken);

      if (imageUrls.length) {
        onChange([
          ...value,
          ...imageUrls.map((image, index) => ({
            image,
            caption: `Preview ${value.length + index + 1}`,
          })),
        ]);
        setUploadStatus(
          `${imageUrls.length} foto berhasil diupload. Lengkapi caption-nya.`,
        );
      }
    } catch {
      setUploadStatus("Gagal memproses gambar. Coba file gambar lain.");
    } finally {
      setIsUploading(false);
    }
  }

  function updateCaption(index: number, caption: string) {
    onChange(
      value.map((item, currentIndex) =>
        currentIndex === index ? { ...item, caption } : item,
      ),
    );
  }

  function removeItem(index: number) {
    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  }

  function movePreviewItem(fromIndex: number, toIndex: number) {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= value.length ||
      toIndex >= value.length
    ) {
      return;
    }

    onChange(reorderItems(value, fromIndex, toIndex));
  }

  function handlePreviewDragStart(
    event: React.DragEvent<HTMLElement>,
    index: number,
  ) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
    setDraggedPreviewIndex(index);
    setDragOverPreviewIndex(index);
  }

  function handlePreviewDrop(
    event: React.DragEvent<HTMLDivElement>,
    toIndex: number,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const rawIndex = event.dataTransfer.getData("text/plain");
    const fromIndex =
      draggedPreviewIndex ?? (rawIndex ? Number(rawIndex) : Number.NaN);

    if (!Number.isNaN(fromIndex)) {
      movePreviewItem(fromIndex, toIndex);
    }

    setDraggedPreviewIndex(null);
    setDragOverPreviewIndex(null);
  }

  function handlePreviewDragEnd() {
    setDraggedPreviewIndex(null);
    setDragOverPreviewIndex(null);
  }

  return (
    <section className="grid gap-4">
      {/* Drop Zone */}
      <div
        className="rounded-xl border-2 border-dashed border-naki-steel bg-naki-frost/50 p-8 text-center outline-none transition focus:border-blue-400"
        onDrop={(event) => {
          event.preventDefault();
          const files = Array.from(event.dataTransfer.files);
          if (files.length) {
            void handleUpload(files);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onPaste={(event) => {
          void handleUpload(Array.from(event.clipboardData.files));
        }}
        tabIndex={0}
      >
        <div className="flex flex-col items-center gap-3">
          <span className="grid size-14 place-items-center rounded-xl bg-white text-naki-secondary shadow-sm">
            <UploadCloud size={24} />
          </span>
          <div>
            <p className="text-sm font-semibold text-naki-primary">
              Drag & Drop foto preview di sini
            </p>
            <p className="mt-1 text-sm text-naki-smoke">
              atau{" "}
              <label className="cursor-pointer font-medium text-naki-primary underline hover:text-naki-secondary">
                browse files
                <input
                  className="sr-only"
                  accept="image/*"
                  disabled={isUploading}
                  multiple
                  onChange={(event) => {
                    void handleUpload(Array.from(event.target.files ?? []));
                    event.target.value = "";
                  }}
                  type="file"
                />
              </label>
            </p>
            <p className="mt-1 text-xs text-naki-smoke">
              Hanya format JPEG dan PNG yang didukung. Maksimal 5MB per file.
            </p>
          </div>
          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-naki-smoke">
              <Loader2 size={16} className="animate-spin" />
              Mengupload...
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Files List */}
      {value.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-naki-primary">
              Uploaded Files
            </p>
            <p className="text-xs text-naki-smoke">
              {value.length} file{value.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="grid gap-2">
            {value.map((item, index) => (
              <div
                key={`${item.image}-${index}`}
                className={`flex items-center gap-3 rounded-xl border bg-white p-3 transition ${
                  dragOverPreviewIndex === index &&
                  draggedPreviewIndex !== null &&
                  draggedPreviewIndex !== index
                    ? "border-naki-primary ring-2 ring-naki-primary/20"
                    : "border-naki-steel"
                } ${draggedPreviewIndex === index ? "opacity-50" : "opacity-100"}`}
                draggable
                onDragOver={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  event.dataTransfer.dropEffect = "move";
                  setDragOverPreviewIndex(index);
                }}
                onDrop={(event) => handlePreviewDrop(event, index)}
                onDragEnd={handlePreviewDragEnd}
                onDragStart={(event) => handlePreviewDragStart(event, index)}
              >
                {/* Sort Handle */}
                <div
                  className="cursor-grab text-naki-smoke transition hover:text-naki-primary active:cursor-grabbing"
                  title="Drag untuk mengurutkan"
                >
                  <GripVertical size={20} />
                </div>

                {/* Thumbnail */}
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-naki-steel bg-naki-frost">
                  {item.image ? (
                    <img
                      className="h-full w-full object-cover"
                      src={item.image}
                      alt={item.caption || "Preview"}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-naki-smoke">
                      <ImagePlus size={16} />
                    </div>
                  )}
                </div>

                {/* Caption / Info */}
                <div className="min-w-0 flex-1">
                  <input
                    className="w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 py-2 text-sm text-naki-primary outline-none transition focus:border-blue-400"
                    value={item.caption}
                    onChange={(event) =>
                      updateCaption(index, event.target.value)
                    }
                    placeholder="Tambahkan caption..."
                    type="text"
                  />
                </div>

                {/* Delete Button */}
                <button
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-naki-smoke transition hover:bg-red-50 hover:text-red-500"
                  onClick={() => removeItem(index)}
                  type="button"
                  title="Hapus gambar"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      {uploadStatus && (
        <p className="text-sm text-naki-smoke">{uploadStatus}</p>
      )}
    </section>
  );
}

export type SourceCodeUploadProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SourceCodeUpload({ value, onChange }: SourceCodeUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  function addSourceFiles(files: File[]) {
    setIsUploading(true);

    // Simulate upload delay
    setTimeout(() => {
      const packageItems = files
        .filter((file) => /\.(zip|rar)$/i.test(file.name))
        .map(
          (file) => `${file.name} (${formatFileSize(file.size)})`,
        );

      if (packageItems.length) {
        onChange(appendLines(value, packageItems));
      }
      setIsUploading(false);
    }, 1000);
  }

  const uploadedFiles = splitLines(value);

  return (
    <section className="grid gap-3">
      {/* Upload Area */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-naki-steel bg-naki-frost p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-white text-naki-secondary">
            <FileArchive size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold text-naki-primary">
              Upload Source Code
            </p>
            <p className="mt-1 text-sm text-naki-smoke">
              ZIP atau RAR codingan.
            </p>
          </div>
        </div>
        <label className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-white transition ${
          isUploading
            ? 'cursor-not-allowed bg-naki-smoke'
            : 'cursor-pointer bg-naki-primary hover:opacity-90'
        }`}>
          {isUploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Mengupload...
            </>
          ) : (
            <>
              <UploadCloud size={16} />
              Upload
            </>
          )}
          <input
            className="sr-only"
            accept=".zip,.rar,application/zip,application/x-rar-compressed"
            multiple
            disabled={isUploading}
            onChange={(event) => {
              addSourceFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
            type="file"
          />
        </label>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-naki-primary">
            Uploaded Files
          </p>
          <div className="grid gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-xl border border-naki-steel bg-white p-3"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-500/10 text-blue-500">
                  <FileArchive size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-naki-primary">
                    {file}
                  </p>
                </div>
                <button
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-naki-smoke transition hover:bg-red-50 hover:text-red-500"
                  onClick={() => {
                    const newFiles = uploadedFiles.filter((_, i) => i !== index);
                    onChange(newFiles.join("\n"));
                  }}
                  type="button"
                  title="Hapus file"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function categorizeStack(items: string[]): { frontend: string[]; backend: string[]; database: string[]; other: string[] } {
  const frontendSet = new Set(frontendStackOptions.map((s) => s.toLowerCase()));
  const backendSet = new Set(backendStackOptions.map((s) => s.toLowerCase()));
  const databaseSet = new Set(databaseStackOptions.map((s) => s.toLowerCase()));

  const frontend: string[] = [];
  const backend: string[] = [];
  const database: string[] = [];
  const other: string[] = [];

  for (const item of items) {
    const lower = item.toLowerCase();
    if (frontendSet.has(lower)) frontend.push(item);
    else if (backendSet.has(lower)) backend.push(item);
    else if (databaseSet.has(lower)) database.push(item);
    else other.push(item);
  }

  return { frontend, backend, database, other };
}

export function templateToForm(template: TemplateItem): TemplateFormState {
  const { frontend, backend, database, other } = categorizeStack(template.stack);

  return {
    id: template.id,
    slug: template.slug,
    title: template.title,
    category: template.category,
    description: template.description,
    price: template.price,
    frontendStack: [...frontend, ...other].join(", "),
    backendStack: backend.join(", "),
    databaseStack: database.join(", "),
    level: template.level,
    accentClass: template.accentClass,
    preview: template.preview,
    demoUrl: template.demoUrl,
    lynkUrl: template.lynkUrl || "",
    features: template.features.join("\n"),
    includedFiles: template.includedFiles.join("\n"),
    sourceCode: template.sourceCode.join("\n"),
    suitableFor: template.suitableFor.join("\n"),
    license: template.license,
    support: template.support,
  };
}

export function formToPayload(
  form: TemplateFormState,
): Omit<TemplateItem, "id" | "rating" | "buyerCount" | "reviews"> {
  const allStack = [
    ...splitLines(form.frontendStack),
    ...splitLines(form.backendStack),
    ...splitLines(form.databaseStack),
  ];

  return {
    slug: form.slug || slugify(form.title),
    title: form.title.trim(),
    category: form.category,
    description: form.description.trim(),
    price: form.price.trim(),
    stack: allStack,
    level: form.level.trim(),
    accentClass: form.accentClass.trim() || "bg-naki-secondary",
    preview: form.preview.filter((item) => item.image || item.caption.trim()),
    demoUrl: form.demoUrl.trim() || "#",
    features: splitLines(form.features),
    includedFiles: splitLines(form.includedFiles),
    sourceCode: splitLines(form.sourceCode),
    suitableFor: splitLines(form.suitableFor),
    license: form.license.trim(),
    support: form.support.trim(),
  };
}

export function splitLines(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function appendLines(currentValue: string, nextItems: string[]) {
  return Array.from(new Set([...splitLines(currentValue), ...nextItems]))
    .filter(Boolean)
    .join("\n");
}

export async function uploadPreviewImages(
  files: File[],
  adminToken: string | null,
) {
  if (!adminToken) {
    throw new Error("Admin token tidak tersedia.");
  }

  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  const data = await apiUpload<{
    images?: Array<{ url: string }>;
  }>("/api/uploads/images", formData);

  return data.images?.map((image) => image.url).filter(Boolean) ?? [];
}

export function reorderItems<Item>(
  items: Item[],
  fromIndex: number,
  toIndex: number,
) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (movedItem === undefined) {
    return items;
  }

  nextItems.splice(toIndex, 0, movedItem);

  return nextItems;
}

export function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatOrderDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
