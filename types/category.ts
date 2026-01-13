// types/category.ts
// Category hierarchy types and helpers

export interface CategoryNode {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  parentId: string | null;
  teamId: string | null;
  order: number;
  path: string | null;
  children?: CategoryNode[];
  level: number; // 0 = Team level, 1 = Parent, 2 = Child
  estimatedDuration?: number | null;
  standardDuration?: number | null;
  isActive: boolean;
}

export interface CategoryTree {
  team: {
    id: string;
    name: string;
  } | null;
  categories: CategoryNode[];
}

// Helper to calculate level
export function getCategoryLevel(category: { parentId: string | null }): number {
  // If no parent = level 0 (team category)
  // Has parent but parent has no parent = level 1
  // Has parent and parent has parent = level 2
  return category.parentId ? 2 : 0; // Simplified - will be calculated properly with full category data
}

// Build category path
export function buildCategoryPath(
  category: { name: string; parentId: string | null },
  categories: Array<{ id: string; name: string; parentId: string | null }>
): string {
  const parts: string[] = [];
  let current: { name: string; parentId: string | null } | null = category;
  
  while (current) {
    parts.unshift(current.name.toLowerCase().replace(/\s+/g, '-'));
    if (!current.parentId) break;
    const parent = categories.find(c => c.id === current!.parentId);
    if (!parent) break;
    current = parent;
  }
  
  return parts.join('/');
}

