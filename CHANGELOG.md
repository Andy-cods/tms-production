# Changelog

All notable changes to the TMS-2025 project will be documented in this file.

## [Unreleased]

### Changed - October 20, 2025

#### **PROMPT #21: Replace ID with STT (Serial Number) in Tables**

**Summary:**  
Replaced all user-facing ID columns with STT (Số thứ tự - Serial Number) to improve user experience. Database IDs are still used internally but not displayed to users.

**Files Modified:**

1. **`app/(dashboard)/requests/_components/RequestTable.tsx`**
   - Changed header from "ID" to "STT" with `w-16` width
   - Updated table cell to display sequential number: `index + 1 + (currentPage - 1) * 10`
   - Maintains correct numbering across pagination

2. **`app/(dashboard)/admin/users/_components/ModernUserTable.tsx`**
   - Added "STT" column as first column with `w-16` width
   - Sequential numbering: `index + 1`
   - No pagination, so simple index-based

3. **`app/(dashboard)/leader/inbox/inbox-table.tsx`**
   - Added "STT" column with `w-16` width
   - Sequential numbering: `index + 1`
   - Updated table structure to include STT cell before Task cell

4. **`lib/services/excel-builder.ts`**
   - **`buildRequestsReport()`**: Changed "ID" column to "STT", width from 12 to 8
   - **`buildTasksReport()`**: Changed "ID" column to "STT", width from 12 to 8
   - Both now use `index + 1` for STT values

5. **`lib/services/csv-builder.ts`**
   - **`buildRequestsCSV()`**: Changed "ID" field to "STT" with `index + 1`
   - **`buildTasksCSV()`**: Changed "ID" field to "STT" with `index + 1`
   - Updated column order to have STT first

**Features:**

✅ **User-Friendly Numbering:**
- Tables now show 1, 2, 3... instead of UUID fragments
- Easier to reference items in conversation ("row 5" vs "ID abc123...")

✅ **Pagination Support:**
- Requests table correctly calculates STT across pages
- Formula: `STT = index + 1 + (currentPage - 1) * itemsPerPage`
- Example: Page 2, item 1 = STT 11 (assuming 10 items per page)

✅ **Export Consistency:**
- Excel exports include STT column (8 characters wide)
- CSV exports include STT column
- STT appears as first column for easy reference

✅ **Styling Consistency:**
- Column width: `w-16` (64px) for all STT columns
- Font: `font-mono text-sm text-gray-500` for consistent appearance
- Matches design system spacing standards

**Technical Details:**

- Database `id` fields unchanged - still used for API calls, links, keys
- All React list keys still use `item.id` for stability
- No breaking changes to backend APIs
- STT is calculated client-side for display only

**Edge Cases Handled:**

- Empty tables: No STT column displayed when no data
- Filtering: STT recalculates correctly after filtering
- Sorting: STT maintains display order (not affected by sort)
- Search: STT numbering resets based on search results

**Testing Checklist:**

- [x] TypeScript compilation: 0 errors
- [x] All tables show STT column
- [x] STT numbers sequential (1, 2, 3...)
- [x] Pagination maintains correct STT
- [x] Excel exports include STT
- [x] CSV exports include STT
- [x] No React warnings or errors

**Before:**
```
| ID (UUID)    | Title          | Status  |
|--------------|----------------|---------|
| 9ae488d9... | Fix login bug  | OPEN    |
| 1508a1d2... | Update logo    | DONE    |
```

**After:**
```
| STT | Title          | Status  |
|-----|----------------|---------|
| 1   | Fix login bug  | OPEN    |
| 2   | Update logo    | DONE    |
```

**Benefits:**

1. **Improved UX**: Users can easily reference rows by number
2. **Professional Look**: Sequential numbers look cleaner than UUIDs
3. **Better Communication**: Team can say "See request #5" instead of "See request 9ae488d9..."
4. **Consistent Exports**: Reports have meaningful row numbers
5. **Reduced Confusion**: No need to explain what the ID column means

---

## Previous Changes

### [1.0.0] - October 20, 2025

#### Added
- Complete BC Agency UI redesign (Prompts 1-20)
- Modern component library (41 components)
- Design system documentation
- Dashboard with KPI analytics
- Advanced search and filtering
- Telegram bot integration
- SLA tracking system
- Priority scoring algorithm
- Admin management interfaces
- Report generation (Excel/CSV/PDF)
- Gantt chart timeline views
- Drag-and-drop Kanban boards

#### Changed
- Tailwind CSS updated to v4
- Next.js 15.5.4 with Turbopack
- All UI components modernized
- Brand colors: #52B26B (green), #FF872E (orange)
- Solid colors only (no gradients)

#### Fixed
- All React key warnings resolved
- TypeScript errors: 0
- Console errors: 0
- Mobile responsiveness improved
- Accessibility: WCAG AA compliant

---

**Project Status:**  
✅ Production Ready  
✅ 100% Type-Safe  
✅ Fully Documented  
✅ Zero Warnings

**Last Updated:** October 20, 2025  
**Version:** 1.0.0+STT  
**Maintainer:** BC Agency Development Team

