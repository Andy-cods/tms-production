import { buildCategoryPath } from "@/types/category";

describe("Category Service", () => {
  describe("buildCategoryPath", () => {
    it("should build path for root category", () => {
      const category = { name: "Backend", parentId: null } as any;
      const categories: any[] = [];

      const path = buildCategoryPath(category, categories);

      expect(path).toBe("backend");
    });

    it("should build path for child category", () => {
      const categories = [
        { id: "1", name: "Backend", parentId: null },
        { id: "2", name: "Bug Fixes", parentId: "1" },
      ];

      const child = { name: "Bug Fixes", parentId: "1" } as any;
      const path = buildCategoryPath(child, categories as any);

      expect(path).toBe("backend/bug-fixes");
    });

    it("should handle special characters", () => {
      const category = { name: "API & Services", parentId: null } as any;
      const path = buildCategoryPath(category, [] as any);

      expect(path).toBe("api-&-services");
    });
  });
});
