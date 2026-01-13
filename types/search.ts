export enum SearchOperator {
	CONTAINS = "CONTAINS",
	EXACT = "EXACT",
	STARTS_WITH = "STARTS_WITH",
	ENDS_WITH = "ENDS_WITH",
}

export type DateRangeFilter = {
	from?: Date;
	to?: Date;
};

export type MultiSelectFilter = {
	values: string[];
	operator: "AND" | "OR";
};

export type SortOrder = "asc" | "desc";
