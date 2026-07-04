import { FileArchive, FileText, Image, Package, Settings, Tag, RefreshCw, Save, X, Monitor, Server, Database, DollarSign } from "lucide-react";
import { useState } from "react";
import type React from "react";
import { createPortal } from "react-dom";
import { type TemplateItem } from "../../domain/content";
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
  frontendStackOptions,
  backendStackOptions,
  databaseStackOptions,
  supportOptions,
  type TemplateFormState,
} from "./AdminTemplateWorkspace.shared";

type TabKey = "info" | "harga" | "stack" | "preview" | "features" | "source" | "settings";

type TabConfig = {
  key: TabKey;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
};

const TABS: TabConfig[] = [
  { key: "info", icon: FileText, label: "Informasi Dasar" },
  { key: "harga", icon: DollarSign, label: "Harga & Link" },
  { key: "stack", icon: Tag, label: "Teknologi" },
  { key: "preview", icon: Image, label: "Media Preview" },
  { key: "features", icon: Package, label: "Fitur" },
  { key: "source", icon: FileArchive, label: "Source Code" },
  { key: "settings", icon: Settings, label: "Pengaturan" },
];

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
  const [activeTab, setActiveTab] = useState<TabKey>("info");

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const activeTabConfig = TABS.find((t) => t.key === activeTab)!;

  function renderTabContent() {
    switch (activeTab) {
      case "info":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-naki-primary">Informasi Dasar</h2>
              <p className="mt-1 text-sm text-naki-smoke">
                Data utama design yang akan ditampilkan sebagai referensi di katalog.
              </p>
            </div>
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
              rows={4}
              required
            />
          </div>
        );

      case "harga":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-naki-primary">Harga & Link</h2>
              <p className="mt-1 text-sm text-naki-smoke">
                Tentukan harga source code design dan link checkout.
              </p>
            </div>
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
              placeholder="https://lynk.id/your-product-link"
            />
          </div>
        );

      case "stack":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-naki-primary">Teknologi</h2>
              <p className="mt-1 text-sm text-naki-smoke">
                Stack teknologi yang digunakan dalam implementasi design ini.
              </p>
            </div>

            {/* Frontend Stack */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-naki-primary">Frontend</h3>
              </div>
              <TagSelector
                label="Pilih teknologi frontend"
                options={frontendStackOptions}
                value={form.frontendStack}
                onChange={(value) => onUpdateField("frontendStack", value)}
              />
            </div>

            {/* Backend Stack */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold text-naki-primary">Backend</h3>
              </div>
              <TagSelector
                label="Pilih teknologi backend"
                options={backendStackOptions}
                value={form.backendStack}
                onChange={(value) => onUpdateField("backendStack", value)}
              />
            </div>

            {/* Database Stack */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-naki-primary">Database</h3>
              </div>
              <TagSelector
                label="Pilih teknologi database"
                options={databaseStackOptions}
                value={form.databaseStack}
                onChange={(value) => onUpdateField("databaseStack", value)}
              />
            </div>
          </div>
        );

      case "preview":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-naki-primary">Media Preview</h2>
              <p className="mt-1 text-sm text-naki-smoke">
                Gambar preview yang akan ditampilkan di halaman detail design.
              </p>
            </div>
            <PreviewDropZone
              adminToken={adminToken}
              value={form.preview}
              onChange={(value) => onUpdateField("preview", value)}
            />
          </div>
        );

      case "features":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-naki-primary">Fitur</h2>
              <p className="mt-1 text-sm text-naki-smoke">
                Daftar fitur, isi source code, dan target pengguna design.
              </p>
            </div>
            <TagInput
              label="Fitur"
              value={form.features}
              onChange={(value) => onUpdateField("features", value)}
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
          </div>
        );

      case "source":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-naki-primary">Source Code</h2>
              <p className="mt-1 text-sm text-naki-smoke">
                Upload file source code design dalam format ZIP atau RAR.
              </p>
            </div>
            <SourceCodeUpload
              value={form.sourceCode}
              onChange={(value) => onUpdateField("sourceCode", value)}
            />
          </div>
        );

      case "settings":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-naki-primary">Pengaturan</h2>
              <p className="mt-1 text-sm text-naki-smoke">
                Lisensi dan support untuk design ini.
              </p>
            </div>
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
          </div>
        );
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto bg-naki-primary/40 px-4 py-6 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-form-title"
    >
      <div className="w-full my-10 mx-4 max-w-5xl rounded-2xl bg-white shadow-sm">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-naki-steel bg-white/95 p-5 backdrop-blur">
          <div className="flex-1">
            <h2 id="template-form-title" className="text-2xl font-bold leading-tight text-naki-primary">
              {selectedTemplate ? "Edit design" : "Tambah design"}
            </h2>
            <p className="mt-1 text-sm text-naki-smoke leading-relaxed">
              {activeTabConfig.label}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`grid size-10 place-items-center rounded-lg transition ${
                    isActive
                      ? "bg-naki-primary text-white shadow-sm"
                      : "text-naki-smoke hover:bg-naki-frost hover:text-naki-primary"
                  }`}
                  title={tab.label}
                  aria-label={tab.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={18} />
                </button>
              );
            })}
            <div className="mx-1 h-6 w-px bg-naki-steel" />
            <button
              className="grid size-10 place-items-center rounded-lg text-naki-secondary transition hover:bg-naki-frost hover:border-naki-secondary"
              onClick={onStartCreate}
              type="button"
              aria-label="Reset form"
              title="Reset form"
            >
              <RefreshCw size={16} />
            </button>
            <button
              className="grid size-10 place-items-center rounded-lg text-naki-primary transition hover:bg-naki-frost hover:border-naki-smoke"
              onClick={onClose}
              type="button"
              aria-label="Tutup form"
              title="Tutup form"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Content */}
        <form className="p-5" onSubmit={onSubmitTemplate}>
          {renderTabContent()}

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-naki-steel pt-5 mt-6">
            <div className="flex items-center gap-1.5">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`grid size-9 place-items-center rounded-lg transition ${
                      isActive
                        ? "bg-naki-primary text-white"
                        : "text-naki-smoke hover:bg-naki-frost"
                    }`}
                    title={tab.label}
                    aria-label={tab.label}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
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
                {isSaving ? "Menyimpan..." : "Simpan design"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
