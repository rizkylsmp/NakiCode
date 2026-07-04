import type { TemplateCategory } from "../domain/content";

export const templateCatalogPath = "/template";
export const templateCategoryBasePath = "/template/kategori";

export function slugifyTemplateCategory(category: string) {
  return category
    .trim()
    .toLowerCase()
    .replace(/&/g, "dan")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getTemplateCategoryPath(category: string) {
  if (category === "Semua") return templateCatalogPath;
  return `${templateCategoryBasePath}/${slugifyTemplateCategory(category)}`;
}

export function getTemplateCategoryFromSlug(
  categories: TemplateCategory[],
  slug?: string,
) {
  if (!slug) return "Semua";

  return (
    categories.find(
      (category) =>
        category !== "Semua" && slugifyTemplateCategory(category) === slug,
    ) ?? "Semua"
  );
}
