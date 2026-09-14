import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  FileText,
  Image,
  Loader2,
  Package,
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
  form: TemplateFormState;
  isOpen: boolean;
  isSaving: boolean;
  selectedTemplate: TemplateItem | undefined;
  adminToken: string | null;
  onClose: () => void;
  onStartCreate: () => void;
  onSubmitTemplate: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdateField: <K extends keyof TemplateFormState>(
    key: K,
    value: TemplateFormState[K],
  ) => void;
};

export function TemplateFormModal({
  categoryOptions,
  form,
  isOpen,
  isSaving,
  selectedTemplate,
  adminToken,
  onClose,
  onSubmitTemplate,
  onUpdateField,
}: Props) {
  const [activeStep, setActiveStep] = useState<StepKey>("info");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const initialSnapshot = useRef("");
  const wasOpen = useRef(false);
  const [mediaUploadState, setMediaUploadState] = useState<MediaUploadState>({
    isUploading: false,
    message: "",
    status: "idle",
  });
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
    }
    wasOpen.current = isOpen;
  }, [form, isOpen, selectedTemplate?.id]);
  useEffect(() => {
    if (!isOpen || selectedTemplate) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(designDraftStorageKey, JSON.stringify(form));
      setSavedAt(new Date());
    }, 450);
    return () => window.clearTimeout(timer);
  }, [form, isOpen, selectedTemplate]);
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
    if (
      JSON.stringify(form) === initialSnapshot.current ||
      window.confirm("Ada perubahan yang belum disimpan. Tutup form?")
    )
      onClose();
  }
  function validate(event: React.FormEvent<HTMLFormElement>) {
    if (!form.title.trim() || !form.category || !form.description.trim()) {
      event.preventDefault();
      setActiveStep("info");
      setValidationMessage("Lengkapi judul, kategori, dan deskripsi.");
      return;
    }
    if (form.publicationStatus === "published" && !complete.media) {
      event.preventDefault();
      setActiveStep("media");
      setValidationMessage(
        "Design published memerlukan minimal satu gambar atau video.",
      );
      return;
    }
    if (form.sourceAvailable && !form.price.trim()) {
      event.preventDefault();
      setActiveStep("sales");
      setValidationMessage("Isi harga atau nonaktifkan penjualan source code.");
      return;
    }
    if (mediaUploadState.isUploading) {
      event.preventDefault();
      setActiveStep("media");
      setValidationMessage("Tunggu upload media selesai.");
      return;
    }
    setValidationMessage("");
    onSubmitTemplate(event);
  }

  const content: Record<StepKey, React.ReactNode> = {
    info: (
      <div className="space-y-5">
        <Heading
          title="Informasi design"
          text="Isi informasi yang akan dibaca pelanggan di katalog."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Judul"
            value={form.title}
            onChange={(value) => {
              onUpdateField("title", value);
              if (!selectedTemplate) onUpdateField("slug", slugify(value));
            }}
            required
          />
          <SelectField
            label="Kategori"
            value={form.category}
            options={categoryOptions}
            onChange={(value) => onUpdateField("category", value)}
          />
          <SelectField
            label="Level"
            value={form.level}
            options={levelOptions}
            onChange={(value) => onUpdateField("level", value)}
          />
          <button
            className="h-11 rounded-xl border border-naki-steel bg-white px-4 text-left text-sm font-medium text-naki-primary hover:bg-naki-frost"
            onClick={() => setShowAdvanced((v) => !v)}
            type="button"
          >
            {showAdvanced ? "Sembunyikan" : "Tampilkan"} pengaturan lanjutan
          </button>
        </div>
        {showAdvanced ? (
          <Field
            label="Slug"
            value={form.slug}
            onChange={(value) => onUpdateField("slug", slugify(value))}
          />
        ) : null}
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
          title="Publikasi dan penjualan"
          text="Simpan sebagai draft atau publikasikan setelah semua informasi siap."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Status"
            value={form.publicationStatus}
            options={[
              { label: "Draft", value: "draft" },
              { label: "Published", value: "published" },
            ]}
            onChange={(value) =>
              onUpdateField("publicationStatus", value as "draft" | "published")
            }
          />
          <label className="flex min-h-11 items-center gap-3 rounded-xl border border-naki-steel bg-naki-frost px-4 text-sm font-medium text-naki-primary">
            <input
              checked={form.sourceAvailable}
              onChange={(e) =>
                onUpdateField("sourceAvailable", e.target.checked)
              }
              type="checkbox"
            />
            Source code dijual
          </label>
        </div>
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
    <div
      className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto bg-naki-primary/40 p-0 backdrop-blur sm:px-4 sm:py-6"
      role="dialog"
      aria-modal="true"
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
                {selectedTemplate ? "Edit design" : "Tambah design"}
              </h2>
              <p className="mt-1 text-xs text-naki-smoke">
                Langkah {activeIndex + 1} dari 4 · {completedCount}/4 lengkap
                {savedAt && !selectedTemplate
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
        <form className="p-4 sm:p-6" onSubmit={validate}>
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
          {content[activeStep]}
          <footer className="mt-7 flex flex-col-reverse gap-3 border-t border-naki-steel pt-5 sm:flex-row sm:items-center sm:justify-between">
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
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-5 text-sm font-semibold text-white disabled:opacity-50"
                disabled={isSaving || mediaUploadState.isUploading}
                type="submit"
              >
                <Save size={17} />
                {isSaving
                  ? "Menyimpan..."
                  : form.publicationStatus === "draft"
                    ? "Simpan draft"
                    : "Publikasikan"}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
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
