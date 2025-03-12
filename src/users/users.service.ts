import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../db/prisma.service';
import * as bcrypt from 'bcryptjs';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterService } from '../common/filters/filter.service';
import { FilterOptions, PaginationOptions } from '../common/filters/filter.interface';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private filterService: FilterService
  ) {}

  async create(createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user with hashed password
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findAll(paginationDto?: PaginationDto) {
    // Define filter options
    const filterOptions = {
      filters: [
        { field: 'role', queryParam: 'role' },
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
      searchFields: ['email', 'name'],
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
      this.prisma.user,
      where,
      paginationDto,
      null,
      undefined,
      paginationOptions as PaginationOptions
    );
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      // If password is being updated, hash it
      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      return await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.user.delete({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}