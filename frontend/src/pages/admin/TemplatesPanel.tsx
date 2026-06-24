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
}: TemplatesPanelProps) {
  return (
        <div className="py-8">
          <section className="min-w-0">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-black">Katalog aktif</h2>
                <p className="mt-1 text-sm font-semibold text-naki-smoke">
                  {filteredTemplatesCount} dari {templates.length} template tampil.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-naki-steel px-3 py-2 text-sm font-black text-naki-secondary">
                  <BadgeCheck size={16} />
                  {status}
                </span>
                <button
                  className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg border border-naki-steel px-4 text-sm font-black text-naki-secondary transition hover:border-naki-smoke"
                  onClick={onOpenCategoryModal}
                  type="button"
                >
                  <Tag size={16} />
                  Kategori
                </button>
                <button
                  className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg bg-naki-secondary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-primary"
                  onClick={onStartCreate}
                  type="button"
                >
                  <Plus size={16} />
                  Template baru
                </button>
              </div>
            </div>

            <div className="mb-4 grid gap-3 rounded-xl border border-naki-steel bg-naki-frost p-4 shadow-naki-card lg:grid-cols-[1fr_240px]">
              <label className="grid gap-1.5 text-sm font-black text-naki-primary">
                Search template
                <input
                  className="h-11 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none transition focus:border-naki-secondary"
                  onChange={(event) => onTemplateSearchChange(event.target.value)}
                  placeholder="Cari judul, slug, kategori, harga..."
                  type="search"
                  value={templateSearch}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-black text-naki-primary">
                Filter kategori
                <select
                  className="h-11 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none transition focus:border-naki-secondary"
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

            <div className="overflow-hidden rounded-lg border border-naki-steel bg-naki-frost shadow-naki-card">
              <div className="hidden grid-cols-[1.1fr_0.7fr_0.5fr_118px] border-b border-naki-steel bg-naki-steel px-4 py-3 text-xs font-black uppercase text-naki-smoke md:grid">
                <span>Template</span>
                <span>Kategori</span>
                <span>Harga</span>
                <span>Aksi</span>
              </div>
              <div className="divide-y divide-naki-steel">
                {paginatedTemplates.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-lg font-black text-naki-primary">
                      Template tidak ditemukan.
                    </p>
                    <p className="mt-2 text-sm font-semibold text-naki-smoke">
                      Coba ubah keyword search atau filter kategori.
                    </p>
                  </div>
                ) : (
                  paginatedTemplates.map((template) => (
                  <article
                    key={template.id}
                    className={`grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.1fr_0.7fr_0.5fr_118px] md:items-center ${
                      selectedId === template.id
                        ? "bg-naki-steel"
                        : "bg-naki-frost"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-black">{template.title}</p>
                      <p className="truncate text-xs font-semibold text-naki-smoke">
                        /templates/{template.slug}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 md:hidden">
                        <span className="rounded-md bg-naki-steel px-2 py-1 text-xs font-black text-naki-primary">
                          {template.category}
                        </span>
                        <span className="rounded-md bg-naki-steel px-2 py-1 text-xs font-black text-naki-primary">
                          {template.price}
                        </span>
                      </div>
                    </div>
                    <span className="hidden font-bold text-naki-smoke md:block">
                      {template.category}
                    </span>
                    <span className="hidden font-black md:block">
                      {template.price}
                    </span>
                    <div className="flex gap-2 md:justify-start">
                      <button
                        className="grid size-10 place-items-center rounded-lg border border-naki-steel text-naki-secondary transition hover:border-naki-smoke"
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
                        className="grid size-10 place-items-center rounded-lg border border-naki-steel text-naki-smoke transition hover:border-naki-smoke hover:text-naki-primary"
                        onClick={() => onDeleteTemplate(template)}
                        type="button"
                        aria-label={`Hapus ${template.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                )))}
              </div>
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
          />
        </div>

  );
}
