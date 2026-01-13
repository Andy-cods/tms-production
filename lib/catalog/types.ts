export type CatalogRule = {
  enforceFixedTime: boolean;
  fixedMinutes?: number;
  fixedHours?: number;
  fixedDays?: number;
};

export type CatalogCategory = "DESIGNER" | "CONTENT" | "ADS" | "PLANNER" | "SALES" | "FINANCE" | "ACCOUNTING" | "CUSTOMER_SERVICE";

export interface CatalogItem {
  id: string;
  category: CatalogCategory;
  name: string;
  description: string;
  estimatedMinutes: number;
  notes?: string;
}

export interface CatalogTemplate {
  id: string;
  name: string;
  description: string;
  catalogItemIds: string[];
  estimatedMinutes: number;
  icon?: string;
  tags?: string[];
}

export type CatalogTemplateInput = Omit<CatalogTemplate, "estimatedMinutes"> & {
  estimatedMinutes?: number;
};

