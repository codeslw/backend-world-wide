export interface FilterConfig {
  field: string;
  operator?:
    | 'equals'
    | 'contains'
    | 'in'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'between'
    | 'startsWith'
    | 'endsWith'
    | 'not'
    | 'some'
    | 'every'
    | 'none';
  queryParam: string;
  transform?: (value: any) => any;
  isArray?: boolean;
}

export interface FilterOptions {
  filters: FilterConfig[];
  defaultLanguage?: string;
  searchFields?: string[];
  searchMode?: 'any' | 'all' | 'contains';
  caseSensitive?: boolean;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
  defaultSortField?: string;
  defaultSortDirection?: 'asc' | 'desc';
}
