# Category Hierarchy System

## Overview
Categories are organized in a 3-level hierarchy:
- Level 0: Root categories (by team)
- Level 1: Parent categories
- Level 2: Child categories

## Structure
```
Dev (Team)
├── Backend (Parent)
│   ├── Bug Fixes (Child)
│   ├── Features (Child)
│   └── API Development (Child)
└── Frontend (Parent)
    ├── UI Components (Child)
    └── Pages (Child)
```

## Fields
- `parentId`: Reference to parent category
- `path`: Auto-generated slug path (e.g., "backend/bug-fixes")
- `order`: Display order within same level
- `icon`: Emoji icon for visual distinction

## Usage

### In Request Form
```tsx
<CategoryTreeSelect
  value={categoryId}
  onChange={setCategoryId}
  teamId={teamId}
  required
/>
```

### In Filters
```tsx
<CategoryFilter
  value={filter}
  onChange={setFilter}
  showAllOption
/>
```

### Display Badge
```tsx
<CategoryBadge
  category={category}
  showBreadcrumb
/>
```

## Admin Management
Path: `/admin/categories`
- Tree view with expand/collapse
- CRUD operations
- Drag & drop reordering (coming soon)
- Validation (max 3 levels)

## Scripts
- `pnpm migrate:categories` - Migrate to new structure
- `pnpm validate:categories` - Check data integrity
