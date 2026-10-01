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
import { getDisplayLocale } from "../../utils/locale";
import { createPortal } from "react-dom";
import type { TemplateItem } from "../../domain/content";
import {
  formatRupiahInputPreview,
  parseRupiahAmount,
} from "../../utils/currency";
import { getSafeDemoUrl } from "../../utils/design-url";
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
} from "./AdminDesignWorkspace.shared";

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
export type DesignSubmitHandler = (
  publicationStatus: "draft" | "published",
) => void | Promise<void | Record<string, string>>;
const FIELD_STEPS: Record<string, StepKey> = {
  title: "info",
  category: "info",
  slug: "info",
  description: "info",
  level: "info",
  preview: "media",
  videoUrl: "media",
  demoUrl: "media",
  stack: "details",
  features: "details",
  includedFiles: "details",
  suitableFor: "details",
  price: "sales",
  lynkUrl: "sales",
  sourceCode: "sales",
  license: "sales",
  support: "sales",
};

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
  onSubmitTemplate: DesignSubmitHandler;
  onUpdateField: <K extends keyof TemplateFormState>(
    key: K,
    value: TemplateFormState[K],
  ) => void;
};

export function DesignFormModal({
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [focusRequest, setFocusRequest] = useState(0);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const initialSnapshot = useRef("");
  const wasOpen = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
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
  const pricePreview = formatRupiahInputPreview(form.price);
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
    if (!validationMessage) return;
    const invalidField = formRef.current?.querySelector<HTMLElement>(
      "[aria-invalid='true']",
    );
    const target =
      invalidField ??
      formRef.current?.querySelector<HTMLElement>("[role='alert']");
    target?.focus();
    target?.scrollIntoView?.({ block: "center" });
  }, [validationMessage, focusRequest, activeStep]);
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      initialSnapshot.current = JSON.stringify(form);
      setActiveStep("info");
      setValidationMessage("");
      setFieldErrors({});
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
  function showErrors(errors: Record<string, string>) {
    setFieldErrors(errors);
    setActiveStep(FIELD_STEPS[Object.keys(errors)[0]] ?? "info");
    setValidationMessage("Design belum tersimpan. Perbaiki field berikut.");
    setFocusRequest((current) => current + 1);
  }
  async function validate(publicationIntent: "draft" | "published") {
    setIsSaveMenuOpen(false);
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Judul wajib diisi.";
    if (!form.category.trim()) errors.category = "Pilih kategori design.";
    if (!form.description.trim()) errors.description = "Deskripsi wajib diisi.";
    if (
      form.demoUrl.trim() &&
      form.demoUrl.trim() !== "#" &&
      !getSafeDemoUrl(form.demoUrl)
    ) {
      errors.demoUrl = "URL demo harus diawali http:// atau https://.";
    }
    if (
      form.sourceAvailable &&
      form.lynkUrl.trim() &&
      (!getSafeDemoUrl(form.lynkUrl) ||
        !/^https:\/\/(?:www\.)?lynk\.id(?:\/|$)/i.test(form.lynkUrl.trim()))
    ) {
      errors.lynkUrl =
        "URL checkout harus menggunakan HTTPS pada domain lynk.id.";
    }
    if (isSlugUsed) {
      errors.slug =
        "Slug sudah digunakan. Gunakan slug lain sebelum menyimpan design.";
    }
    if (publicationIntent === "published" && !complete.media) {
      errors.preview =
        "Tambahkan minimal satu gambar atau video untuk publikasi.";
    }
    if (form.sourceAvailable && (parseRupiahAmount(form.price) ?? 0) <= 0) {
      errors.price = "Isi harga source code dengan nominal lebih dari Rp. 0,-.";
    }
    if (mediaUploadState.isUploading) {
      errors.preview = "Tunggu upload media selesai.";
    }
    for (const [field, max] of Object.entries({
      title: 160,
      category: 80,
      description: 10000,
      slug: 180,
      price: 32,
      demoUrl: 500,
      lynkUrl: 500,
    })) {
      if (String(form[field as keyof TemplateFormState]).trim().length > max) {
        errors[field] = `Maksimal ${max} karakter.`;
      }
    }
    if (Object.keys(errors).length) {
      showErrors(errors);
      return;
    }
    setValidationMessage("");
    setFieldErrors({});
    const serverErrors = await onSubmitTemplate(publicationIntent);
    if (serverErrors && Object.keys(serverErrors).length)
      showErrors(serverErrors);
  }

  function updateField<K extends keyof TemplateFormState>(
    key: K,
    value: TemplateFormState[K],
  ) {
    onUpdateField(key, value);
    setFieldErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
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
                updateField("title", value);
                if (!isEditing) updateField("slug", slugify(value));
              }}
              required
              error={fieldErrors.title}
            />
          </div>
          <div className="order-3 md:order-2">
            <SelectField
              label="Kategori"
              value={form.category}
              options={categoryOptions}
              onChange={(value) => updateField("category", value)}
              error={fieldErrors.category}
            />
          </div>
          <div className="order-2 md:order-3">
            <SelectField
              label="Level"
              value={form.level}
              options={levelOptions}
              onChange={(value) => updateField("level", value)}
              error={fieldErrors.level}
            />
          </div>
          <div className="order-4 grid gap-1.5">
            <Field
              label="Slug"
              value={form.slug}
              onChange={(value) =>
                updateField("slug", normalizeDesignSlug(value))
              }
              placeholder="contoh-design"
              error={fieldErrors.slug}
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
          onChange={(value) => updateField("description", value)}
          rows={5}
          required
          error={fieldErrors.description}
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
          onChange={(value) => updateField("preview", value)}
          onVideoChange={(value) => updateField("videoUrl", value)}
          onUploadStateChange={setMediaUploadState}
        />
        {fieldErrors.preview ? (
          <p className="text-xs font-medium text-red-700" role="alert">
            {fieldErrors.preview}
          </p>
        ) : null}
        <Field
          label="Demo URL"
          value={form.demoUrl}
          onChange={(value) => updateField("demoUrl", value)}
          placeholder="https://demo.example.com"
          error={fieldErrors.demoUrl}
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
          onChange={(value) => updateField("frontendStack", value)}
        />
        <TagSelector
          label="Backend"
          options={backendStackOptions}
          value={form.backendStack}
          onChange={(value) => updateField("backendStack", value)}
        />
        <TagSelector
          label="Database"
          options={databaseStackOptions}
          value={form.databaseStack}
          onChange={(value) => updateField("databaseStack", value)}
        />
        <TagInput
          label="Fitur"
          value={form.features}
          onChange={(value) => updateField("features", value)}
        />
        <TagInput
          label="Isi paket"
          value={form.includedFiles}
          onChange={(value) => updateField("includedFiles", value)}
        />
        <TagInput
          label="Cocok untuk"
          value={form.suitableFor}
          onChange={(value) => updateField("suitableFor", value)}
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
            onChange={(e) => updateField("sourceAvailable", e.target.checked)}
            type="checkbox"
          />
          Source code dijual
        </label>
        {form.sourceAvailable ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Field
                  label="Harga"
                  value={form.price}
                  onChange={(value) => updateField("price", value)}
                  placeholder="Contoh: 5000000"
                  error={fieldErrors.price}
                />
                {pricePreview ? (
                  <p
                    aria-live="polite"
                    className="text-xs font-semibold text-naki-secondary"
                  >
                    {pricePreview}
                  </p>
                ) : null}
              </div>
              <Field
                label="Lynk Checkout URL"
                value={form.lynkUrl}
                onChange={(value) => updateField("lynkUrl", value)}
                placeholder="https://lynk.id/..."
                error={fieldErrors.lynkUrl}
              />
              <SelectField
                label="Lisensi"
                value={form.license}
                options={licenseOptions}
                onChange={(value) => updateField("license", value)}
              />
              <SelectField
                label="Support"
                value={form.support}
                options={supportOptions}
                onChange={(value) => updateField("support", value)}
              />
            </div>
            <SourceCodeUpload
              adminToken={adminToken}
              value={form.sourceCode}
              onChange={(value) => updateField("sourceCode", value)}
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
                    ? ` · Draft tersimpan ${savedAt.toLocaleTimeString(getDisplayLocale(), { hour: "2-digit", minute: "2-digit" })}`
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
                    }}
                    role="tab"
                    aria-label={step.label}
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
            ref={formRef}
            noValidate
            className="p-4 sm:p-6"
            onSubmit={(event) => {
              event.preventDefault();
              validate(form.publicationStatus);
            }}
          >
            {validationMessage ? (
              <div
                className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                role="alert"
                tabIndex={-1}
                aria-live="assertive"
              >
                <p className="flex items-start gap-2">
                  <CircleAlert className="shrink-0" size={17} />
                  {validationMessage}
                </p>
                {Object.values(fieldErrors).length ? (
                  <ul className="mt-2 ml-6 list-disc space-y-1">
                    {Object.entries(fieldErrors).map(([field, message]) => (
                      <li key={field}>
                        <button
                          className="text-left underline underline-offset-2"
                          type="button"
                          onClick={() =>
                            setActiveStep(FIELD_STEPS[field] ?? "info")
                          }
                        >
                          {message}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
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
              <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:gap-3">
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
