import { Injectable } from '@nestjs/common';
import { ProfilesRepository } from './profiles.repository';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterService } from '../common/filters/filter.service';
import { FilterOptions, PaginationOptions } from '../common/filters/filter.interface';
import { PrismaService } from '../db/prisma.service';
import { EntityNotFoundException, InvalidDataException } from '../common/exceptions/app.exceptions';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly profilesRepository: ProfilesRepository,
    private readonly filterService: FilterService,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, createProfileDto: CreateProfileDto) {
    try {
      return this.profilesRepository.create(userId, createProfileDto);
    } catch (error) {
      // Let the global exception filter handle Prisma errors
      throw error;
    }
  }

  async findAll(paginationDto?: PaginationDto) {
    try {
      // Define filter options
      const filterOptions = {
        filters: [
          { 
            field: 'createdAt', 
            queryParam: 'createdAfter', 
            operator: 'gte',
            transform: (value) => new Date(value)
          },
          { 
            field: 'createdAt', 
            queryParam: 'createdBefore', 
            operator: 'lte',
            transform: (value) => new Date(value)
          }
        ],
        searchFields: ['firstName', 'lastName', 'email', 'phoneNumber'],
        searchMode: 'contains',
        caseSensitive: false
      };
      
      // Build filter query
      const where = this.filterService.buildFilterQuery(paginationDto || {}, filterOptions as FilterOptions);
      
      // Define pagination options
      const paginationOptions = {
        defaultLimit: 10,
        maxLimit: 300,
        defaultSortField: 'createdAt',
        defaultSortDirection: 'desc'
      };
      
      // Apply pagination and get results
      return this.filterService.applyPagination(
        this.prisma.profile,
        where,
        paginationDto,
        null,
        undefined,
        paginationOptions as PaginationOptions
      );
    } catch (error) {
      // Let the global exception filter handle database errors
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const profile = await this.profilesRepository.findById(id);
      if (!profile) {
        throw new EntityNotFoundException('Profile', id);
      }
      return profile;
    } catch (error) {
      // If it's already our custom exception, just rethrow it
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      // Otherwise let the global exception filter handle it
      throw error;
    }
  }

  async findByUserId(userId: string) {
    try {
      const profile = await this.profilesRepository.findByUserId(userId);
      if (!profile) {
        throw new EntityNotFoundException('Profile for user', userId);
      }
      return profile;
    } catch (error) {
      // If it's already our custom exception, just rethrow it
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      // Otherwise let the global exception filter handle it
      throw error;
    }
  }

  async update(id: string, updateProfileDto: UpdateProfileDto) {
    try {
      // First check if profile exists
      const profile = await this.profilesRepository.findById(id);
      
      if (!profile) {
        throw new EntityNotFoundException('Profile', id);
      }
      
      return await this.profilesRepository.update(id, updateProfileDto);
    } catch (error) {
      // If it's already our custom exception, just rethrow it
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      // Otherwise let the global exception filter handle it
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // First check if profile exists
      const profile = await this.profilesRepository.findById(id);
      
      if (!profile) {
        throw new EntityNotFoundException('Profile', id);
      }
      
      return await this.profilesRepository.remove(id);
    } catch (error) {
      // If it's already our custom exception, just rethrow it
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      // Otherwise let the global exception filter handle it
      throw error;
    }
  }
} 