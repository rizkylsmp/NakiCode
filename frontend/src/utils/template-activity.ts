import type { TemplateItem } from "../domain/content";

const searchHistoryKey = "naki_code_search_history";
const recentlyViewedKey = "naki_code_recently_viewed_templates";

type RecentlyViewedTemplate = {
  id: number;
  slug: string;
  title: string;
  category: string;
  viewedAt: string;
};

export function readSearchHistory() {
  return readStorageArray<string>(searchHistoryKey);
}

export function saveSearchTerm(value: string) {
  const query = value.trim();

  if (query.length < 2) {
    return readSearchHistory();
  }

  const nextHistory = [
    query,
    ...readSearchHistory().filter(
      (item) => item.toLowerCase() !== query.toLowerCase(),
    ),
  ].slice(0, 6);

  writeStorage(searchHistoryKey, nextHistory);
  return nextHistory;
}

export function readRecentlyViewedTemplates() {
  return readStorageArray<RecentlyViewedTemplate>(recentlyViewedKey);
}

export function saveRecentlyViewedTemplate(template: TemplateItem) {
  const nextItems = [
    {
      id: template.id,
      slug: template.slug,
      title: template.title,
      category: template.category,
      viewedAt: new Date().toISOString(),
    },
    ...readRecentlyViewedTemplates().filter((item) => item.id !== template.id),
  ].slice(0, 6);

  writeStorage(recentlyViewedKey, nextItems);
  return nextItems;
}

function readStorageArray<T>(key: string): T[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeStorage<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}
