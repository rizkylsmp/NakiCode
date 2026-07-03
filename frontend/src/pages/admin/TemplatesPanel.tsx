import { BadgeCheck, Edit3, Plus, Trash2 } from "lucide-react";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-naki-primary">Templates</h1>
          <p className="mt-1 text-sm text-naki-smoke">
            {filteredTemplatesCount} dari {templates.length} template tampil.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-naki-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          onClick={onStartCreate}
          type="button"
        >
          <Plus size={16} />
          New Template
        </button>
      </div>

      {/* Search & filter bar */}
      <div className="grid gap-3 rounded-xl border border-naki-steel bg-white p-4 shadow-sm md:grid-cols-[1fr_240px]">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-naki-smoke">Search template</span>
          <input
            className="h-10 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-naki-primary"
            onChange={(event) => onTemplateSearchChange(event.target.value)}
            placeholder="Search by title, slug, category, price..."
            type="search"
            value={templateSearch}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-naki-smoke">Filter category</span>
          <select
            className="h-10 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-naki-primary"
            onChange={(event) => onTemplateCategoryFilterChange(event.target.value)}
            value={templateCategoryFilter}
          >
            <option value="all">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Template list */}
      <div className="space-y-2">
        {paginatedTemplates.length === 0 ? (
          <div className="rounded-xl border border-naki-steel bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-semibold text-naki-primary">
              No templates found.
            </p>
            <p className="mt-2 text-sm text-naki-smoke">
              Try adjusting your search or filter.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-naki-steel bg-white shadow-sm overflow-hidden">
            {paginatedTemplates.map((template, index) => (
              <article
                key={template.id}
                className={`flex items-center justify-between px-6 py-4 transition ${
                  index !== paginatedTemplates.length - 1 ? "border-b border-naki-steel" : ""
                } ${
                  selectedId === template.id
                    ? "bg-naki-frost"
                    : "hover:bg-naki-frost"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-naki-primary">
                      {template.title}
                    </p>
                    <span className="shrink-0 rounded-md bg-naki-frost px-2 py-0.5 text-xs font-medium text-naki-smoke">
                      {template.category}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-naki-smoke">
                    /templates/{template.slug}
                  </p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <p className="text-sm font-semibold text-naki-primary">
                    {template.price}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      className="grid size-8 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost hover:text-naki-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartEdit(template);
                      }}
                      type="button"
                      aria-label={`Edit ${template.title}`}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      className="grid size-8 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost hover:text-naki-secondary"
                      onClick={() => onDeleteTemplate(template)}
                      type="button"
                      aria-label={`Hapus ${template.title}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <PaginationControls
        page={templatesPage}
        total={filteredTemplatesCount}
        totalPages={templatesTotalPages}
        pageSize={adminTemplatesPageSize}
        onPageChange={onTemplatesPageChange}
      />
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
