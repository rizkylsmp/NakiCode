import type { TemplateCategory } from "../domain/content";

export const templateCatalogPath = "/design";
export const templateCategoryBasePath = "/design/kategori";

export function getSafeDemoUrl(value?: string | null) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? value.trim()
      : null;
  } catch {
    return null;
  }
}

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
