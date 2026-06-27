import {
  ArrowDown,
  ArrowUp,
  FileArchive,
  GripVertical,
  ImagePlus,
  UploadCloud,
  X,
} from "lucide-react";
import { useState } from "react";
import type React from "react";
import { apiUpload } from "../../api-client";
import {
  type PortfolioItem,
  type TemplateCategory,
  type TemplateItem,
  type TemplatePreviewItem,
} from "../../content";

export type TemplateFormState = {
  id?: number;
  slug: string;
  title: string;
  category: TemplateItem["category"];
  description: string;
  price: string;
  stack: string;
  level: string;
  accentClass: string;
  preview: TemplatePreviewItem[];
  demoUrl: string;
  features: string;
  includedFiles: string;
  suitableFor: string;
  license: string;
  support: string;
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
  category: TemplateCategory;
  categories: TemplateCategory[];
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

export type OrderStatus = "new" | "contacted" | "deal" | "closed";
export type OrderStatusFilter = "all" | OrderStatus;
export type PaymentStatusFilter =
  | "all"
  | "pending"
  | "waiting_payment"
  | "paid"
  | "failed";
export type DashboardView = "dashboard" | "templates" | "orders" | "portfolio";
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
  return section === "templates" ||
    section === "orders" ||
    section === "portfolio"
    ? section
    : "dashboard";
}

export function legacyHashToAdminView(hash: string): DashboardView | null {
  const view = hash.replace("#", "");

  return view === "templates" || view === "orders" || view === "portfolio"
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
export const levelOptions = ["Pemula", "Menengah", "Lanjut"];
export const stackOptions = [
  "React",
  "Vite",
  "Tailwind",
  "TypeScript",
  "Express",
  "MySQL",
  "API",
  "Motion",
  "Chart",
];
export const licenseOptions = [
  "Boleh dipakai untuk satu personal/client project. Tidak untuk dijual ulang sebagai template mentah.",
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
};

export function Field({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  step,
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
  const [validationError, setValidationError] = useState<string | null>(null);

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
  const [uploadStatus, setUploadStatus] = useState(
    "Upload foto, lalu isi caption untuk tiap foto.",
  );

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
    setUploadStatus(
      `Preview ${fromIndex + 1} dipindah ke posisi ${toIndex + 1}.`,
    );
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

  function canMovePreviewItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    return nextIndex >= 0 && nextIndex < value.length;
  }

  function handlePreviewDragEnd() {
    setDraggedPreviewIndex(null);
    setDragOverPreviewIndex(null);
  }

  return (
    <section className="grid gap-3">
      <p className="text-xs font-medium text-naki-smoke uppercase tracking-wide">
        Preview
      </p>
      <ImageUploadDropZone
        adminToken={adminToken}
        title="Upload / drop / paste foto preview"
        description="Bisa lebih dari satu gambar. File disimpan sebagai URL, bukan base64."
        status={uploadStatus}
        onStatusChange={setUploadStatus}
        onUploaded={(imageUrls) => {
          onChange([
            ...value,
            ...imageUrls.map((image, index) => ({
              image,
              caption: `Preview ${value.length + index + 1}`,
            })),
          ]);
        }}
        successMessage={(imageUrls) =>
          `${imageUrls.length} foto berhasil diupload. Lengkapi caption-nya.`
        }
      />

      {value.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((item, index) => (
            <div
              key={`${item.image}-${index}`}
              className={`overflow-hidden rounded-xl border bg-white transition ${
                dragOverPreviewIndex === index &&
                draggedPreviewIndex !== null &&
                draggedPreviewIndex !== index
                  ? "border-naki-secondary shadow-naki-card"
                  : "border-naki-steel"
              } ${
                draggedPreviewIndex === index ? "opacity-70" : "opacity-100"
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = "move";
                setDragOverPreviewIndex(index);
              }}
              onDrop={(event) => handlePreviewDrop(event, index)}
            >
              <div
                className="flex cursor-grab items-center justify-between gap-2 border-b border-naki-steel bg-naki-steel px-3 py-2 active:cursor-grabbing"
                draggable
                onDragEnd={handlePreviewDragEnd}
                onDragStart={(event) => handlePreviewDragStart(event, index)}
                title="Drag untuk mengurutkan gambar dan caption"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase text-naki-smoke">
                    Posisi {index + 1}
                  </p>
                  <p className="truncate text-sm font-medium text-naki-primary">
                    {item.caption || "Belum ada caption"}
                  </p>
                </div>
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-lg border border-naki-steel bg-naki-frost text-naki-secondary"
                  aria-hidden="true"
                >
                  <GripVertical size={17} />
                </span>
              </div>
              {item.image ? (
                <img
                  className="h-36 w-full cursor-grab object-cover active:cursor-grabbing"
                  draggable
                  onDragEnd={handlePreviewDragEnd}
                  onDragStart={(event) => handlePreviewDragStart(event, index)}
                  src={item.image}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  loading="lazy"
                  decoding="async"
                  alt={item.caption || "Preview template"}
                  title="Drag gambar untuk mengurutkan"
                />
              ) : (
                <div
                  className="grid h-36 cursor-grab place-items-center bg-naki-steel text-sm font-medium text-naki-smoke active:cursor-grabbing"
                  draggable
                  onDragEnd={handlePreviewDragEnd}
                  onDragStart={(event) => handlePreviewDragStart(event, index)}
                  title="Drag untuk mengurutkan"
                >
                  Belum ada foto
                </div>
              )}
              <div className="grid gap-2 border-t border-naki-steel p-3">
                <label className="grid gap-1 text-xs font-medium text-naki-smoke">
                  Caption foto
                  <input
                    className="h-10 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-blue-400"
                    value={item.caption}
                    onChange={(event) =>
                      updateCaption(index, event.target.value)
                    }
                    placeholder="Contoh: Tampilan homepage"
                    type="text"
                  />
                </label>
              </div>
              <div className="grid grid-cols-3 border-t border-naki-steel">
                <button
                  className="flex h-10 items-center justify-center gap-1 border-r border-naki-steel text-xs font-medium text-naki-secondary transition hover:bg-naki-frost disabled:cursor-not-allowed disabled:text-naki-smoke"
                  disabled={!canMovePreviewItem(index, -1)}
                  onClick={() => movePreviewItem(index, index - 1)}
                  type="button"
                >
                  <ArrowUp size={14} />
                  Naik
                </button>
                <button
                  className="flex h-10 items-center justify-center gap-1 border-r border-naki-steel text-xs font-medium text-naki-secondary transition hover:bg-naki-frost disabled:cursor-not-allowed disabled:text-naki-smoke"
                  disabled={!canMovePreviewItem(index, 1)}
                  onClick={() => movePreviewItem(index, index + 1)}
                  type="button"
                >
                  <ArrowDown size={14} />
                  Turun
                </button>
                <button
                  className="flex h-10 items-center justify-center gap-1 text-xs font-medium text-naki-secondary transition hover:bg-naki-frost hover:text-naki-primary"
                  onClick={() => removeItem(index)}
                  type="button"
                >
                  <X size={14} />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export type SourceCodeUploadProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SourceCodeUpload({ value, onChange }: SourceCodeUploadProps) {
  function addSourceFiles(files: File[]) {
    const packageItems = files
      .filter((file) => /\.(zip|rar)$/i.test(file.name))
      .map(
        (file) => `Source package: ${file.name} (${formatFileSize(file.size)})`,
      );

    if (packageItems.length) {
      onChange(appendLines(value, packageItems));
    }
  }

  return (
    <section className="grid gap-3">
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-naki-steel bg-naki-frost p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-white text-naki-secondary">
            <FileArchive size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold text-naki-primary">
              Source code
            </p>
            <p className="mt-1 text-sm text-naki-smoke">
              ZIP atau RAR codingan.
            </p>
          </div>
        </div>
        <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-medium text-white transition hover:opacity-90">
          <UploadCloud size={16} />
          Upload
          <input
            className="sr-only"
            accept=".zip,.rar,application/zip,application/x-rar-compressed"
            multiple
            onChange={(event) => {
              addSourceFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
            type="file"
          />
        </label>
      </div>
      <TagInput label="Isi source code" value={value} onChange={onChange} />
    </section>
  );
}

export function templateToForm(template: TemplateItem): TemplateFormState {
  return {
    id: template.id,
    slug: template.slug,
    title: template.title,
    category: template.category,
    description: template.description,
    price: template.price,
    stack: template.stack.join(", "),
    level: template.level,
    accentClass: template.accentClass,
    preview: template.preview,
    demoUrl: template.demoUrl,
    features: template.features.join("\n"),
    includedFiles: template.includedFiles.join("\n"),
    suitableFor: template.suitableFor.join("\n"),
    license: template.license,
    support: template.support,
  };
}

export function formToPayload(
  form: TemplateFormState,
): Omit<TemplateItem, "id" | "rating" | "buyerCount" | "reviews"> {
  return {
    slug: form.slug || slugify(form.title),
    title: form.title.trim(),
    category: form.category,
    description: form.description.trim(),
    price: form.price.trim(),
    stack: splitLines(form.stack),
    level: form.level.trim(),
    accentClass: form.accentClass.trim() || "bg-naki-secondary",
    preview: form.preview.filter((item) => item.image || item.caption.trim()),
    demoUrl: form.demoUrl.trim() || "#",
    features: splitLines(form.features),
    includedFiles: splitLines(form.includedFiles),
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
