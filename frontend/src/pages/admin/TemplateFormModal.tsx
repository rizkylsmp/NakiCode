import { RefreshCw, Save, X } from "lucide-react";
import type React from "react";
import { createPortal } from "react-dom";
import { type TemplateItem } from "../../content";
import {
  Field,
  PreviewDropZone,
  SelectField,
  SourceCodeUpload,
  TagInput,
  TagSelector,
  TextArea,
  licenseOptions,
  levelOptions,
  slugify,
  stackOptions,
  supportOptions,
  type TemplateFormState,
} from "./AdminTemplateWorkspace.shared";

type TemplateFormModalProps = {
  categoryOptions: TemplateItem["category"][];
  form: TemplateFormState;
  isOpen: boolean;
  isSaving: boolean;
  selectedTemplate: TemplateItem | undefined;
  adminToken: string | null;
  onClose: () => void;
  onStartCreate: () => void;
  onSubmitTemplate: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdateField: <Key extends keyof TemplateFormState>(
    key: Key,
    value: TemplateFormState[Key],
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
  onStartCreate,
  onSubmitTemplate,
  onUpdateField,
}: TemplateFormModalProps) {
  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto bg-naki-primary/40 px-4 py-6 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-form-title"
    >
      <div className="w-full my-10 mx-4 max-w-7xl rounded-2xl bg-white shadow-sm">
        <div className="sticky top-0 z-10 flex flex-col justify-between gap-3 border-b border-naki-steel bg-white/95 p-5 backdrop-blur sm:flex-row sm:items-start">
          <div>
            <h2 id="template-form-title" className="text-2xl font-bold leading-tight text-naki-primary">
              {selectedTemplate ? "Edit template" : "Tambah template"}
            </h2>
            <p className="mt-1 text-sm text-naki-smoke leading-relaxed">
              Kelola data katalog yang tersimpan ke database.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="grid size-10 place-items-center rounded-lg border border-naki-steel bg-white text-naki-secondary transition hover:border-naki-secondary"
              onClick={onStartCreate}
              type="button"
              aria-label="Reset form"
            >
              <RefreshCw size={16} />
            </button>
            <button
              className="grid size-10 place-items-center rounded-lg border border-naki-steel bg-white text-naki-primary transition hover:border-naki-smoke"
              onClick={onClose}
              type="button"
              aria-label="Tutup form"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <form className="grid gap-5 p-5" onSubmit={onSubmitTemplate}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Judul"
              value={form.title}
              onChange={(value) => onUpdateField("title", value)}
              required
            />
            <Field
              label="Slug"
              value={form.slug}
              onChange={(value) => onUpdateField("slug", slugify(value))}
              required
            />
            <SelectField
              label="Kategori"
              value={form.category}
              options={categoryOptions}
              onChange={(value) =>
                onUpdateField("category", value as TemplateItem["category"])
              }
            />
            <Field
              label="Harga"
              value={form.price}
              onChange={(value) => onUpdateField("price", value)}
            />
            <SelectField
              label="Level"
              value={form.level}
              options={levelOptions}
              onChange={(value) => onUpdateField("level", value)}
            />
          </div>

          <TextArea
            label="Deskripsi"
            value={form.description}
            onChange={(value) => onUpdateField("description", value)}
            rows={3}
            required
          />

          <TagSelector
            label="Stack"
            options={stackOptions}
            value={form.stack}
            onChange={(value) => onUpdateField("stack", value)}
          />

          <PreviewDropZone
            adminToken={adminToken}
            value={form.preview}
            onChange={(value) => onUpdateField("preview", value)}
          />

          <TagInput
            label="Fitur"
            value={form.features}
            onChange={(value) => onUpdateField("features", value)}
          />

          <SourceCodeUpload
            value={form.sourceCode}
            onChange={(value) => onUpdateField("sourceCode", value)}
          />

          <TagInput
            label="Isi source code"
            value={form.includedFiles}
            onChange={(value) => onUpdateField("includedFiles", value)}
          />

          <TagInput
            label="Cocok untuk"
            value={form.suitableFor}
            onChange={(value) => onUpdateField("suitableFor", value)}
          />

          <div className="grid gap-4 md:grid-cols-2">
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

          <Field
            label="Lynk Checkout URL"
            value={form.lynkUrl}
            onChange={(value) => onUpdateField("lynkUrl", value)}
            placeholder="https://lynk.id/your-product-link"
          />

          <div className="flex flex-col-reverse gap-3 border-t border-naki-steel pt-5 sm:flex-row sm:justify-end">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-5 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-5 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-naki-smoke"
              disabled={isSaving}
              type="submit"
            >
              <Save size={17} />
              {isSaving ? "Menyimpan..." : "Simpan template"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
