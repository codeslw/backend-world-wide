import { Injectable } from '@nestjs/common';
import { FilterConfig, FilterOptions, SortConfig, PaginationOptions } from './filter.interface';
import { PaginationDto } from '../dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FilterService {
  buildFilterQuery(query: any, options: FilterOptions): any {
    const { filters, searchFields = [], searchMode = 'any', caseSensitive = false } = options;
    const where: any = {};
    
    // Apply specific filters
    for (const filter of filters) {
      const { field, queryParam, operator = 'equals', transform, isArray = false } = filter;
      
      // Skip undefined, null or empty string values
      if (query[queryParam] === undefined || query[queryParam] === null || query[queryParam] === '') {
        continue;
      }
      
      let value = query[queryParam];
      
      // Apply transformation if provided
      if (transform) {
        try {
          value = transform(value);
          // Skip if transformation resulted in NaN or invalid value
          if (typeof value === 'number' && isNaN(value)) {
            continue;
          }
        } catch (error) {
          // Skip this filter if transformation fails
          continue;
        }
      }
      
      // Handle array values
      if (isArray && !Array.isArray(value)) {
        value = value.toString().split(',');
      }
      
      // Apply the filter based on the operator
      switch (operator) {
        case 'equals':
          where[field] = value;
          break;
        case 'contains':
          where[field] = { 
            contains: value,
            ...(caseSensitive ? {} : { mode: 'insensitive' })
          };
          break;
        case 'startsWith':
          where[field] = { 
            startsWith: value,
            ...(caseSensitive ? {} : { mode: 'insensitive' })
          };
          break;
        case 'endsWith':
          where[field] = { 
            endsWith: value,
            ...(caseSensitive ? {} : { mode: 'insensitive' })
          };
          break;
        case 'in':
          where[field] = { in: Array.isArray(value) ? value : [value] };
          break;
        case 'some':
          where[field] = { some: value };
          break;
        case 'every':
          where[field] = { every: value };
          break;
        case 'none':
          where[field] = { none: value };
          break;
        case 'not':
          where[field] = { not: value };
          break;
        case 'gt':
          where[field] = { gt: value };
          break;
        case 'gte':
          where[field] = { gte: value };
          break;
        case 'lt':
          where[field] = { lt: value };
          break;
        case 'lte':
          where[field] = { lte: value };
          break;
        case 'between':
          if (Array.isArray(value) && value.length === 2) {
            where[field] = { gte: value[0], lte: value[1] };
          }
          break;
      }
    }
    
    // Apply search if provided with improved validation
    if (query.search && typeof query.search === 'string' && query.search.trim() !== '' && searchFields.length > 0) {
      const searchValue = query.search.trim();
      const searchConditions = searchFields.map(field => ({
        [field]: { 
          contains: searchValue,
          ...(caseSensitive ? {} : { mode: 'insensitive' })
        }
      }));
      
      if (searchMode === 'contains') {
        // For 'contains' mode, we just use OR like 'any' mode
        where.OR = searchConditions;
      } else if (searchMode === 'any') {
        where.OR = searchConditions;
      } else {
        where.AND = searchConditions;
      }
    }
    
    return where;
  }
  
  buildSortOptions(query: any, options: PaginationOptions = {}): any {
    const { 
      defaultSortField = 'createdAt', 
      defaultSortDirection = 'desc' 
    } = options;
    
    let orderBy: any = {};
    
    // Check if sort parameters are provided
    if (query.sortBy) {
      const sortField = query.sortBy;
      const sortDirection = query.sortDirection?.toLowerCase() === 'asc' ? 'asc' : 'desc';
      orderBy[sortField] = sortDirection;
    } else {
      // Use default sort
      orderBy[defaultSortField] = defaultSortDirection;
    }
    
    return orderBy;
  }
  
  async applyPagination<T>(
    model: any,
    where: any,
    paginationDto: PaginationDto,
    include?: any,
    orderBy?: any,
    options: PaginationOptions = {}
  ): Promise<{ data: T[]; meta: any }> {
    const { 
      defaultLimit = 10,
      maxLimit = 100
    } = options;
    
    // Extract pagination parameters with safer defaults
    let page = 1;
    let limit = defaultLimit;
    
    if (paginationDto) {
      // Parse pagination values more safely
      if (paginationDto.page !== undefined) {
        const parsedPage = Number(paginationDto.page);
        if (!isNaN(parsedPage) && parsedPage > 0) {
          page = parsedPage;
        }
      }
      
      if (paginationDto.limit !== undefined) {
        const parsedLimit = Number(paginationDto.limit);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          limit = parsedLimit;
        }
      }
    }
    
    // Ensure limit doesn't exceed maximum
    limit = Math.min(limit, maxLimit);
    
    // Calculate skip value
    const skip = (page - 1) * limit;
    
    // Use provided orderBy or build from query
    const sortOptions = orderBy || this.buildSortOptions(paginationDto || {}, options);
    
    try {
      // Get total count for pagination
      const total = await model.count({ where });
      
      // Get paginated results
      const data = await model.findMany({
        where,
        include,
        skip,
        take: limit,
        orderBy: sortOptions,
      });
      
      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      // If there's an error with the query, log it and return empty results
      console.error('Error in pagination query:', error);
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }
  }
} 