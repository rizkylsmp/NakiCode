import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  FileText,
  Image,
  Loader2,
  Package,
  Rocket,
  Save,
  ShoppingBag,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { createPortal } from "react-dom";
import type { TemplateItem } from "../../domain/content";
import {
  Field,
  PreviewDropZone,
  SelectField,
  SourceCodeUpload,
  TagInput,
  TagSelector,
  TextArea,
  backendStackOptions,
  databaseStackOptions,
  frontendStackOptions,
  levelOptions,
  licenseOptions,
  normalizeDesignSlug,
  slugify,
  supportOptions,
  type MediaUploadState,
  type TemplateFormState,
} from "./AdminTemplateWorkspace.shared";

type StepKey = "info" | "media" | "details" | "sales";
const STEPS = [
  { key: "info", label: "Informasi", icon: FileText },
  { key: "media", label: "Media", icon: Image },
  { key: "details", label: "Detail", icon: Package },
  { key: "sales", label: "Penjualan", icon: ShoppingBag },
] satisfies Array<{
  key: StepKey;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}>;
export const designDraftStorageKey = "naki-admin-design-draft-v1";

type Props = {
  categoryOptions: string[];
  existingSlugs?: Array<{ id: number; slug: string }>;
  form: TemplateFormState;
  isOpen: boolean;
  isSaving: boolean;
  saveStatus?: string;
  selectedTemplate: TemplateItem | undefined;
  adminToken: string | null;
  onClose: () => void;
  onStartCreate: () => void;
  onSubmitTemplate: (publicationStatus: "draft" | "published") => void;
  onUpdateField: <K extends keyof TemplateFormState>(
    key: K,
    value: TemplateFormState[K],
  ) => void;
};

export function TemplateFormModal({
  categoryOptions,
  existingSlugs = [],
  form,
  isOpen,
  isSaving,
  saveStatus = "",
  selectedTemplate,
  adminToken,
  onClose,
  onSubmitTemplate,
  onUpdateField,
}: Props) {
  const [activeStep, setActiveStep] = useState<StepKey>("info");
  const [validationMessage, setValidationMessage] = useState("");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const initialSnapshot = useRef("");
  const wasOpen = useRef(false);
  const [mediaUploadState, setMediaUploadState] = useState<MediaUploadState>({
    isUploading: false,
    message: "",
    status: "idle",
  });
  const isEditing = form.id !== undefined;
  const primaryPublicationStatus = form.publicationStatus;
  const primarySaveLabel = isSaving
    ? "Menyimpan..."
    : isEditing
      ? "Simpan perubahan"
      : form.publicationStatus === "draft"
        ? "Simpan draft"
        : "Publikasikan";
  const effectiveSlug = normalizeDesignSlug(form.slug || form.title);
  const isSlugUsed = Boolean(
    effectiveSlug &&
      existingSlugs.some(
        (design) =>
          design.id !== form.id &&
          normalizeDesignSlug(design.slug) === effectiveSlug,
      ),
  );
  const complete = useMemo(
    () => ({
      info: Boolean(
        form.title.trim() && form.category && form.description.trim(),
      ),
      media: Boolean(form.preview.some((item) => item.image) || form.videoUrl),
      details: Boolean(
        form.frontendStack.trim() ||
        form.backendStack.trim() ||
        form.databaseStack.trim() ||
        form.features.trim(),
      ),
      sales: Boolean(
        form.publicationStatus === "draft" ||
        !form.sourceAvailable ||
        form.price.trim(),
      ),
    }),
    [form],
  );
  const activeIndex = STEPS.findIndex((step) => step.key === activeStep);
  const completedCount = Object.values(complete).filter(Boolean).length;

  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      initialSnapshot.current = JSON.stringify(form);
      setActiveStep("info");
      setValidationMessage("");
      setShowUnsavedDialog(false);
      setIsSaveMenuOpen(false);
    }
    wasOpen.current = isOpen;
  }, [form, isOpen, selectedTemplate?.id]);
  useEffect(() => {
    if (!isOpen || isEditing) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(designDraftStorageKey, JSON.stringify(form));
      setSavedAt(new Date());
    }, 450);
    return () => window.clearTimeout(timer);
  }, [form, isEditing, isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(form) !== initialSnapshot.current)
        event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [form, isOpen]);
  if (!isOpen || typeof document === "undefined") return null;

  function requestClose() {
    if (JSON.stringify(form) === initialSnapshot.current) {
      onClose();
      return;
    }
    setShowUnsavedDialog(true);
  }
  function validate(publicationIntent: "draft" | "published") {
    setIsSaveMenuOpen(false);
    if (!form.title.trim() || !form.category || !form.description.trim()) {
      setActiveStep("info");
      setValidationMessage("Lengkapi judul, kategori, dan deskripsi.");
      return;
    }
    if (isSlugUsed) {
      setActiveStep("info");
      setValidationMessage(
        "Slug sudah digunakan. Gunakan slug lain sebelum menyimpan design.",
      );
      return;
    }
    if (publicationIntent === "published" && !complete.media) {
      setActiveStep("media");
      setValidationMessage(
        "Design published memerlukan minimal satu gambar atau video.",
      );
      return;
    }
    if (form.sourceAvailable && !form.price.trim()) {
      setActiveStep("sales");
      setValidationMessage("Isi harga atau nonaktifkan penjualan source code.");
      return;
    }
    if (mediaUploadState.isUploading) {
      setActiveStep("media");
      setValidationMessage("Tunggu upload media selesai.");
      return;
    }
    setValidationMessage("");
    onSubmitTemplate(publicationIntent);
  }

  const content: Record<StepKey, React.ReactNode> = {
    info: (
      <div className="space-y-5">
        <Heading
          title="Informasi design"
          text="Isi informasi yang akan dibaca pelanggan di katalog."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="order-1">
            <Field
              label="Judul"
              value={form.title}
              onChange={(value) => {
                onUpdateField("title", value);
                if (!isEditing) onUpdateField("slug", slugify(value));
              }}
              required
            />
          </div>
          <div className="order-3 md:order-2">
            <SelectField
              label="Kategori"
              value={form.category}
              options={categoryOptions}
              onChange={(value) => onUpdateField("category", value)}
            />
          </div>
          <div className="order-2 md:order-3">
            <SelectField
              label="Level"
              value={form.level}
              options={levelOptions}
              onChange={(value) => onUpdateField("level", value)}
            />
          </div>
          <div className="order-4 grid gap-1.5">
            <Field
              label="Slug"
              value={form.slug}
              onChange={(value) =>
                onUpdateField("slug", normalizeDesignSlug(value))
              }
              placeholder="contoh-design"
            />
            <p
              className={`text-xs font-medium ${
                isSlugUsed
                  ? "text-red-600"
                  : effectiveSlug
                    ? "text-emerald-600"
                    : "text-naki-smoke"
              }`}
              aria-live="polite"
            >
              {isSlugUsed
                ? "Slug sudah digunakan oleh design lain."
                : effectiveSlug
                  ? `Slug tersedia: /design/${effectiveSlug}`
                  : "Slug otomatis mengikuti judul dan tetap bisa diedit."}
            </p>
          </div>
        </div>
        <TextArea
          label="Deskripsi"
          value={form.description}
          onChange={(value) => onUpdateField("description", value)}
          rows={5}
          required
        />
      </div>
    ),
    media: (
      <div className="space-y-5">
        <Heading
          title="Media dan demo"
          text="Upload cover, galeri, video, lalu tambahkan URL demo bila tersedia."
        />
        <PreviewDropZone
          adminToken={adminToken}
          value={form.preview}
          videoValue={form.videoUrl}
          isUploadInProgress={mediaUploadState.isUploading}
          onChange={(value) => onUpdateField("preview", value)}
          onVideoChange={(value) => onUpdateField("videoUrl", value)}
          onUploadStateChange={setMediaUploadState}
        />
        <Field
          label="Demo URL"
          value={form.demoUrl}
          onChange={(value) => onUpdateField("demoUrl", value)}
          placeholder="https://demo.example.com"
        />
      </div>
    ),
    details: (
      <div className="space-y-6">
        <Heading
          title="Teknologi dan isi design"
          text="Pilih stack dan rangkum manfaat utama design."
        />
        <TagSelector
          label="Frontend"
          options={frontendStackOptions}
          value={form.frontendStack}
          onChange={(value) => onUpdateField("frontendStack", value)}
        />
        <TagSelector
          label="Backend"
          options={backendStackOptions}
          value={form.backendStack}
          onChange={(value) => onUpdateField("backendStack", value)}
        />
        <TagSelector
          label="Database"
          options={databaseStackOptions}
          value={form.databaseStack}
          onChange={(value) => onUpdateField("databaseStack", value)}
        />
        <TagInput
          label="Fitur"
          value={form.features}
          onChange={(value) => onUpdateField("features", value)}
        />
        <TagInput
          label="Isi paket"
          value={form.includedFiles}
          onChange={(value) => onUpdateField("includedFiles", value)}
        />
        <TagInput
          label="Cocok untuk"
          value={form.suitableFor}
          onChange={(value) => onUpdateField("suitableFor", value)}
        />
      </div>
    ),
    sales: (
      <div className="space-y-5">
        <Heading
          title="Penjualan source code"
          text="Atur ketersediaan, harga, checkout, lisensi, support, dan paket source code."
        />
        <label className="flex min-h-11 items-center gap-3 rounded-xl border border-naki-steel bg-naki-frost px-4 text-sm font-medium text-naki-primary md:w-fit">
          <input
            checked={form.sourceAvailable}
            onChange={(e) =>
              onUpdateField("sourceAvailable", e.target.checked)
            }
            type="checkbox"
          />
          Source code dijual
        </label>
        {form.sourceAvailable ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Harga"
                value={form.price}
                onChange={(value) => onUpdateField("price", value)}
                placeholder="Contoh: Rp149K"
              />
              <Field
                label="Lynk Checkout URL"
                value={form.lynkUrl}
                onChange={(value) => onUpdateField("lynkUrl", value)}
                placeholder="https://lynk.id/..."
              />
              <SelectField
                label="Lisensi"
                value={form.license}
                options={licenseOptions}
                onChange={(value) => onUpdateField("license", value)}
              />
              <SelectField
                label="Support"
                value={form.support}
                options={supportOptions}
                onChange={(value) => onUpdateField("support", value)}
              />
            </div>
            <SourceCodeUpload
              adminToken={adminToken}
              value={form.sourceCode}
              onChange={(value) => onUpdateField("sourceCode", value)}
            />
          </>
        ) : (
          <p className="rounded-xl border border-naki-steel bg-naki-frost p-4 text-sm text-naki-smoke">
            Field penjualan disembunyikan karena source code tidak dijual.
          </p>
        )}
      </div>
    ),
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto bg-naki-primary/40 p-0 backdrop-blur sm:px-4 sm:py-6"
        role="dialog"
        aria-modal="true"
        aria-hidden={showUnsavedDialog || undefined}
        aria-labelledby="design-form-title"
      >
      <div className="min-h-dvh w-full bg-white shadow-sm sm:my-6 sm:min-h-0 sm:max-w-5xl sm:rounded-2xl">
        <header className="sticky top-0 z-20 border-b border-naki-steel bg-white/95 p-4 backdrop-blur sm:rounded-t-2xl sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="design-form-title"
                className="text-xl font-bold text-naki-primary"
              >
                {isEditing ? "Edit design" : "Tambah design"}
              </h2>
              <p className="mt-1 text-xs text-naki-smoke">
                Langkah {activeIndex + 1} dari 4 · {completedCount}/4 lengkap
                {savedAt && !isEditing
                  ? ` · Draft tersimpan ${savedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
                  : ""}
              </p>
            </div>
            <button
              aria-label="Tutup form"
              className="grid size-11 place-items-center rounded-xl text-naki-smoke hover:bg-naki-frost"
              onClick={requestClose}
              type="button"
            >
              <X size={18} />
            </button>
          </div>
          <div
            className="mt-4 grid grid-cols-4 gap-2"
            role="tablist"
            aria-label="Langkah input design"
          >
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const active = step.key === activeStep;
              return (
                <button
                  key={step.key}
                  className={`min-h-11 rounded-xl border px-2 py-2 text-xs font-semibold transition ${active ? "border-naki-secondary bg-naki-secondary text-white" : "border-naki-steel bg-naki-frost text-naki-smoke"}`}
                  onClick={() => {
                    setActiveStep(step.key);
                    setValidationMessage("");
                  }}
                  role="tab"
                  aria-selected={active}
                  type="button"
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="hidden sm:inline">
                      {complete[step.key] ? <Check size={14} /> : index + 1}
                    </span>
                    <Icon size={15} />
                    <span className="hidden md:inline">{step.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </header>
        <form
          className="p-4 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            validate(form.publicationStatus);
          }}
        >
          {validationMessage ? (
            <div
              className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              aria-live="assertive"
            >
              <CircleAlert size={17} />
              {validationMessage}
            </div>
          ) : null}
          {mediaUploadState.message ? (
            <p
              className="mb-4 flex items-center gap-2 text-xs font-medium text-naki-secondary"
              aria-live="polite"
            >
              {mediaUploadState.isUploading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : null}
              {mediaUploadState.message}
            </p>
          ) : null}
          {saveStatus ? (
            <p
              className="mb-4 rounded-xl border border-naki-steel bg-naki-frost px-4 py-3 text-sm font-medium text-naki-primary"
              aria-live="polite"
            >
              {saveStatus}
            </p>
          ) : null}
          {content[activeStep]}
          <footer className="sticky bottom-0 z-20 -mx-4 -mb-4 mt-7 flex flex-col-reverse gap-3 border-t border-naki-steel bg-white/95 px-4 pb-4 pt-4 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur sm:-mx-6 sm:-mb-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pb-6">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-5 text-sm font-medium text-naki-primary disabled:opacity-40"
              disabled={activeIndex === 0}
              onClick={() => setActiveStep(STEPS[activeIndex - 1].key)}
              type="button"
            >
              <ChevronLeft size={17} />
              Sebelumnya
            </button>
            <div className="grid grid-cols-2 gap-3 sm:flex">
              {activeIndex < 3 ? (
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-secondary px-5 text-sm font-semibold text-white"
                  onClick={() => setActiveStep(STEPS[activeIndex + 1].key)}
                  type="button"
                >
                  Berikutnya
                  <ChevronRight size={17} />
                </button>
              ) : null}
              <div className="relative flex min-w-0 overflow-visible rounded-xl shadow-sm">
                <button
                  className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-l-xl bg-naki-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  disabled={isSaving || mediaUploadState.isUploading}
                  onClick={() => validate(primaryPublicationStatus)}
                  type="button"
                >
                  <Save size={17} />
                  {primarySaveLabel}
                </button>
                <button
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-r-xl border-l border-white/20 bg-naki-primary text-white transition hover:opacity-90 disabled:opacity-50"
                  disabled={isSaving || mediaUploadState.isUploading}
                  aria-expanded={isSaveMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Pilih cara menyimpan"
                  onClick={() => setIsSaveMenuOpen((current) => !current)}
                  type="button"
                >
                  <ChevronUp
                    className={`transition ${isSaveMenuOpen ? "rotate-0" : "rotate-180"}`}
                    size={16}
                  />
                </button>
                {isSaveMenuOpen ? (
                  <div
                    className="absolute bottom-full right-0 z-30 mb-2 w-72 overflow-hidden rounded-xl border border-naki-steel bg-white p-1.5 shadow-xl"
                    role="menu"
                    aria-label="Pilihan simpan design"
                  >
                    <PublicationAction
                      current={form.publicationStatus === "draft"}
                      description="Simpan tanpa menampilkan design di katalog."
                      icon={<FileText size={17} />}
                      label="Simpan sebagai draft"
                      onSelect={() => validate("draft")}
                      status="draft"
                    />
                    <PublicationAction
                      current={form.publicationStatus === "published"}
                      description="Tampilkan design di katalog setelah validasi."
                      icon={<Rocket size={17} />}
                      label="Publikasikan"
                      onSelect={() => validate("published")}
                      status="published"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </footer>
        </form>
      </div>
      </div>
      {showUnsavedDialog ? (
        <UnsavedChangesDialog
          publicationStatus={form.publicationStatus}
          onCancel={() => setShowUnsavedDialog(false)}
          onDiscard={() => {
            setShowUnsavedDialog(false);
            onClose();
          }}
        />
      ) : null}
    </>,
    document.body,
  );
}

function PublicationAction({
  current,
  description,
  icon,
  label,
  onSelect,
  status,
}: {
  current: boolean;
  description: string;
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
  status: "draft" | "published";
}) {
  return (
    <button
      className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-naki-frost"
      data-publication-status={status}
      onClick={onSelect}
      role="menuitem"
      type="button"
    >
      <span
        className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${
          status === "published"
            ? "bg-naki-primary text-white"
            : "bg-naki-frost text-naki-smoke"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2 text-sm font-semibold text-naki-primary">
          {label}
          {current ? (
            <span className="rounded-full bg-naki-frost px-2 py-0.5 text-[10px] font-semibold uppercase text-naki-smoke">
              Saat ini
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-naki-smoke">
          {description}
        </span>
      </span>
    </button>
  );
}

function UnsavedChangesDialog({
  publicationStatus,
  onCancel,
  onDiscard,
}: {
  publicationStatus: "draft" | "published";
  onCancel: () => void;
  onDiscard: () => void;
}) {
  const isDraft = publicationStatus === "draft";

  return (
    <div
      className="fixed inset-0 z-[10000] grid place-items-center bg-naki-primary/60 px-4 py-6 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="unsaved-design-title"
      aria-describedby="unsaved-design-description"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-naki-steel bg-white shadow-xl">
        <div className="flex items-start gap-3 border-b border-naki-steel bg-naki-frost p-5">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle size={21} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-naki-smoke">
              Perubahan belum disimpan
            </p>
            <h2
              id="unsaved-design-title"
              className="mt-1 text-xl font-bold text-naki-primary"
            >
              {isDraft
                ? "Draft ini belum disimpan"
                : "Perubahan belum dipublikasikan"}
            </h2>
          </div>
        </div>
        <p
          id="unsaved-design-description"
          className="p-5 text-sm leading-relaxed text-naki-smoke"
        >
          Jika form ditutup sekarang, perubahan terakhir pada design akan
          hilang. Kembali ke form untuk menyimpan terlebih dahulu.
        </p>
        <div className="flex flex-col-reverse gap-2 border-t border-naki-steel bg-naki-frost p-4 sm:flex-row sm:justify-end">
          <button
            className="inline-flex h-11 items-center justify-center rounded-xl border border-naki-steel bg-white px-4 text-sm font-semibold text-naki-primary transition hover:bg-naki-page-bg"
            onClick={onDiscard}
            type="button"
          >
            Buang perubahan
          </button>
          <button
            className="inline-flex h-11 items-center justify-center rounded-xl bg-naki-primary px-4 text-sm font-semibold text-white transition hover:opacity-90"
            autoFocus
            onClick={onCancel}
            type="button"
          >
            Kembali mengedit
          </button>
        </div>
      </div>
    </div>
  );
}

function Heading({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-naki-primary">{title}</h3>
      <p className="mt-1 text-sm text-naki-smoke">{text}</p>
    </div>
  );
}
