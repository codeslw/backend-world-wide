import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfilesRepository } from './profiles.repository';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterService } from '../common/filters/filter.service';
import { FilterOptions, PaginationOptions } from '../common/filters/filter.interface';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly profilesRepository: ProfilesRepository,
    private readonly filterService: FilterService,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, createProfileDto: CreateProfileDto) {
    return this.profilesRepository.create(userId, createProfileDto);
  }

  async findAll(paginationDto?: PaginationDto) {
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
      maxLimit: 50,
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
  }

  async findOne(id: string) {
    const profile = await this.profilesRepository.findById(id);
    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
    return profile;
  }

  async findByUserId(userId: string) {
    const profile = await this.profilesRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException(`Profile for user with ID ${userId} not found`);
    }
    return profile;
  }

  async update(id: string, updateProfileDto: UpdateProfileDto) {
    try {
      return await this.profilesRepository.update(id, updateProfileDto);
    } catch (error) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.profilesRepository.remove(id);
    } catch (error) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
  }
} 