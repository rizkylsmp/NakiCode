import { BadgeCheck, Edit3, Plus, Tag, Trash2 } from "lucide-react";
import type React from "react";
import { PaginationControls } from "../../components/PaginationControls";
import { type TemplateItem } from "../../content";
import { adminTemplatesPageSize, type TemplateFormState } from "./AdminTemplateWorkspace.shared";
import { CategoryModal } from "./CategoryModal";
import { TemplateFormModal } from "./TemplateFormModal";

type TemplatesPanelProps = {
  templates: TemplateItem[];
  paginatedTemplates: TemplateItem[];
  filteredTemplatesCount: number;
  templatesPage: number;
  templatesTotalPages: number;
  templateSearch: string;
  templateCategoryFilter: string;
  categoryOptions: TemplateItem["category"][];
  selectedId: number | null;
  selectedTemplate: TemplateItem | undefined;
  form: TemplateFormState;
  status: string;
  isSaving: boolean;
  isTemplateModalOpen: boolean;
  adminToken: string | null;
  categoryName: string;
  isSavingCategory: boolean;
  isCategoryModalOpen: boolean;
  editingCategory: string | null;
  editingCategoryName: string;
  onTemplateSearchChange: (value: string) => void;
  onTemplateCategoryFilterChange: (value: string) => void;
  onTemplatesPageChange: (page: number) => void;
  onStartCreate: () => void;
  onStartEdit: (template: TemplateItem) => void;
  onCloseTemplateModal: () => void;
  onDeleteTemplate: (template: TemplateItem) => void;
  onSubmitTemplate: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdateField: <Key extends keyof TemplateFormState>(key: Key, value: TemplateFormState[Key]) => void;
  onOpenCategoryModal: () => void;
  onCloseCategoryModal: () => void;
  onSubmitCategory: (event: React.FormEvent<HTMLFormElement>) => void;
  onCategoryNameChange: (value: string) => void;
  onEditCategoryNameChange: (value: string) => void;
  onEditCategory: (name: string) => void;
  onSaveEditCategory: () => void;
  onCancelEditCategory: () => void;
  onDeleteCategory: (name: string) => void;
  isDeletingCategory: boolean;
};

export function TemplatesPanel({
  templates,
  paginatedTemplates,
  filteredTemplatesCount,
  templatesPage,
  templatesTotalPages,
  templateSearch,
  templateCategoryFilter,
  categoryOptions,
  selectedId,
  selectedTemplate,
  form,
  status,
  isSaving,
  isTemplateModalOpen,
  adminToken,
  categoryName,
  isSavingCategory,
  isCategoryModalOpen,
  editingCategory,
  editingCategoryName,
  onTemplateSearchChange,
  onTemplateCategoryFilterChange,
  onTemplatesPageChange,
  onStartCreate,
  onStartEdit,
  onCloseTemplateModal,
  onDeleteTemplate,
  onSubmitTemplate,
  onUpdateField,
  onOpenCategoryModal,
  onCloseCategoryModal,
  onSubmitCategory,
  onCategoryNameChange,
  onEditCategoryNameChange,
  onEditCategory,
  onSaveEditCategory,
  onCancelEditCategory,
  onDeleteCategory,
  isDeletingCategory,
}: TemplatesPanelProps) {
  return (
    <div className="bg-naki-page-bg py-8">
      <section className="min-w-0">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-naki-primary leading-tight">Katalog aktif</h2>
            <p className="mt-1 text-sm text-naki-smoke leading-relaxed">
              {filteredTemplatesCount} dari {templates.length} template tampil.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl bg-naki-frost px-3 py-2 text-sm font-semibold text-naki-secondary">
              <BadgeCheck size={16} />
              {status}
            </span>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-4 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
              onClick={onOpenCategoryModal}
              type="button"
            >
              <Tag size={16} />
              Kategori
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-medium text-white transition hover:opacity-90"
              onClick={onStartCreate}
              type="button"
            >
              <Plus size={16} />
              Template baru
            </button>
          </div>
        </div>

        {/* Search & filter bar */}
        <div className="mb-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm lg:grid-cols-[1fr_240px]">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-naki-smoke">Search template</span>
            <input
              className="h-11 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-blue-400"
              onChange={(event) => onTemplateSearchChange(event.target.value)}
              placeholder="Cari judul, slug, kategori, harga..."
              type="search"
              value={templateSearch}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-naki-smoke">Filter kategori</span>
            <select
              className="h-11 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-blue-400"
              onChange={(event) => onTemplateCategoryFilterChange(event.target.value)}
              value={templateCategoryFilter}
            >
              <option value="all">Semua kategori</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Template list */}
        <div className="space-y-3">
          {paginatedTemplates.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-semibold text-naki-primary">
                Template tidak ditemukan.
              </p>
              <p className="mt-2 text-sm text-naki-smoke">
                Coba ubah keyword search atau filter kategori.
              </p>
            </div>
          ) : (
            paginatedTemplates.map((template) => (
              <article
                key={template.id}
                className={`group rounded-2xl bg-white p-4 shadow-sm transition duration-200 sm:p-5 ${
                  selectedId === template.id
                    ? "ring-2 ring-naki-secondary/30"
                    : "hover:shadow-md"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Template info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold text-naki-primary">
                        {template.title}
                      </p>
                      <span className="shrink-0 rounded-md bg-naki-frost px-2 py-0.5 text-xs font-medium text-naki-smoke">
                        {template.category}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-naki-smoke">
                      /templates/{template.slug}
                    </p>
                    <p className="mt-2 text-sm font-medium text-naki-primary">
                      {template.price}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      className="grid size-10 place-items-center rounded-xl border border-naki-steel bg-white text-naki-smoke transition hover:border-naki-secondary hover:text-naki-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartEdit(template);
                      }}
                      type="button"
                      aria-label={`Edit ${template.title}`}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="grid size-10 place-items-center rounded-xl border border-naki-steel bg-white text-naki-smoke transition hover:border-red-400 hover:text-red-500"
                      onClick={() => onDeleteTemplate(template)}
                      type="button"
                      aria-label={`Hapus ${template.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <PaginationControls
          page={templatesPage}
          total={filteredTemplatesCount}
          totalPages={templatesTotalPages}
          pageSize={adminTemplatesPageSize}
          onPageChange={onTemplatesPageChange}
        />
      </section>
      <TemplateFormModal
        categoryOptions={categoryOptions}
        form={form}
        isOpen={isTemplateModalOpen}
        isSaving={isSaving}
        selectedTemplate={selectedTemplate}
        adminToken={adminToken}
        onClose={onCloseTemplateModal}
        onStartCreate={onStartCreate}
        onSubmitTemplate={onSubmitTemplate}
        onUpdateField={onUpdateField}
      />
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={onCloseCategoryModal}
        onSubmit={onSubmitCategory}
        categoryName={categoryName}
        onCategoryNameChange={onCategoryNameChange}
        isSavingCategory={isSavingCategory}
        categoryOptions={categoryOptions}
        editingCategory={editingCategory}
        editingCategoryName={editingCategoryName}
        onEditCategoryNameChange={onEditCategoryNameChange}
        onEditCategory={onEditCategory}
        onSaveEditCategory={onSaveEditCategory}
        onCancelEditCategory={onCancelEditCategory}
        onDeleteCategory={onDeleteCategory}
        isDeletingCategory={isDeletingCategory}
      />
    </div>
  );
}
