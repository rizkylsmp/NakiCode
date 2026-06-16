import { createContext, useContext, useEffect, useState } from 'react';
import type { TemplateItem } from './content';

type CompareContextType = {
  compareIds: number[];
  addToCompare: (template: TemplateItem) => void;
  removeFromCompare: (templateId: number) => void;
  clearCompare: () => void;
  isInCompare: (templateId: number) => boolean;
  canAddMore: boolean;
};

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const COMPARE_STORAGE_KEY = 'naki-compare-templates';
const MAX_COMPARE = 3;

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareIds, setCompareIds] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareIds));
    } catch {
      // Storage failed, continue without persistence
    }
  }, [compareIds]);

  const addToCompare = (template: TemplateItem) => {
    setCompareIds((current) => {
      if (current.includes(template.id)) {
        return current;
      }
      
      if (current.length >= MAX_COMPARE) {
        // Remove oldest and add new
        return [...current.slice(1), template.id];
      }
      
      return [...current, template.id];
    });
  };

  const removeFromCompare = (templateId: number) => {
    setCompareIds((current) => current.filter((id) => id !== templateId));
  };

  const clearCompare = () => {
    setCompareIds([]);
  };

  const isInCompare = (templateId: number) => {
    return compareIds.includes(templateId);
  };

  const canAddMore = compareIds.length < MAX_COMPARE;

  return (
    <CompareContext.Provider
      value={{
        compareIds,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        canAddMore,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  
  if (!context) {
    throw new Error('useCompare must be used within CompareProvider');
  }
  
  return context;
}
