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
      
      if (query[queryParam] !== undefined) {
        let value = query[queryParam];
        
        // Apply transformation if provided
        if (transform) {
          value = transform(value);
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
              ...(caseSensitive ? {} : { mode: Prisma.QueryMode.insensitive })
            };
            break;
          case 'startsWith':
            where[field] = { 
              startsWith: value,
              ...(caseSensitive ? {} : { mode: Prisma.QueryMode.insensitive })
            };
            break;
          case 'endsWith':
            where[field] = { 
              endsWith: value,
              ...(caseSensitive ? {} : { mode: Prisma.QueryMode.insensitive })
            };
            break;
          case 'in':
            where[field] = { in: Array.isArray(value) ? value : [value] };
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
    }
    
    // Apply search if provided
    if (query.search && searchFields.length > 0) {
      const searchConditions = searchFields.map(field => ({
        [field]: { 
          contains: query.search,
          ...(caseSensitive ? {} : { mode: Prisma.QueryMode.insensitive })
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
    
    // Extract pagination parameters
    let { page = 1, limit = defaultLimit } = paginationDto || {};
    
    // Ensure limit doesn't exceed maximum
    limit = Math.min(limit, maxLimit);
    
    // Calculate skip value
    const skip = (page - 1) * limit;
    
    // Use provided orderBy or build from query
    const sortOptions = orderBy || this.buildSortOptions(paginationDto || {}, options);
    
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
  }
} 