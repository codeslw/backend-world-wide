import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../db/prisma.service';
import * as bcrypt from 'bcryptjs';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterService } from '../common/filters/filter.service';
import { FilterOptions, PaginationOptions } from '../common/filters/filter.interface';
import { ProfilesService } from '../profiles/profiles.service';
import { EntityNotFoundException, ConflictException, InvalidDataException } from '../common/exceptions/app.exceptions';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private filterService: FilterService,
    private profilesService?: ProfilesService
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException(`Email ${createUserDto.email} is already in use`);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Extract profile data if present
      const { profile, ...userData } = createUserDto;

      // Create user with hashed password
      const user = await this.prisma.user.create({
        data: {
          ...userData,
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

      // Create profile if profile data is provided
      if (profile && this.profilesService) {
        await this.profilesService.create(user.id, profile);
      }

      return user;
    } catch (error) {
      // If it's already our custom exception, just rethrow it
      if (error instanceof ConflictException) {
        throw error;
      }
      // Otherwise let the global exception filter handle it
      throw error;
    }
  }


  async createMany(createUserDto: CreateUserDto[]) {
    try {
      // Check if user already exists
      const existingUsers = await this.prisma.user.findMany({
        where: { email: { in: createUserDto.map(user => user.email) } },
      });

      if (existingUsers.length > 0) {
        const duplicateEmails = existingUsers.map(user => user.email).join(', ');
        throw new ConflictException(`Some emails are already in use: ${duplicateEmails}`);
      }
      
      // Hash passwords
      const hashedPasswords = await Promise.all(createUserDto.map(async (user) => { 
        return await bcrypt.hash(user.password, 10);
      }));

      // Separate profile data from user data
      const userData = createUserDto.map((user, index) => {
        // Extract profile data for later use
        const { profile, ...userOnly } = user;
        
        return {
          ...userOnly,
          password: hashedPasswords[index],
        };
      });

      // Create users without profiles
      const users = await this.prisma.user.createMany({
        data: userData
      });

      // If profiles need to be created and ProfilesService is available
      if (this.profilesService) {
        // Get created users to get their IDs
        const createdUsers = await this.prisma.user.findMany({
          where: { email: { in: createUserDto.map(user => user.email) } },
        });
        
        // Create profiles for each user if profile data was provided
        for (let i = 0; i < createUserDto.length; i++) {
          const user = createdUsers.find(u => u.email === createUserDto[i].email);
          const profileData = createUserDto[i].profile;
          
          if (user && profileData) {
            await this.profilesService.create(user.id, profileData);
          }
        }
      }

      return users;
    } catch (error) {
      // If it's already our custom exception, just rethrow it
      if (error instanceof ConflictException) {
        throw error;
      }
      // Otherwise let the global exception filter handle it
      throw error;
    }
  }

  async findByEmail(email: string) {
    try {
      return this.prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      // Let the global exception filter handle database errors
      throw error;
    }
  }

  async findAll(paginationDto?: PaginationDto) {
    try {
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
        searchFields: ['email'],
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
    } catch (error) {
      // Let the global exception filter handle database errors
      throw error;
    }
  }

  async findOne(id: string) {
    try {
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
        throw new EntityNotFoundException('User', id);
      }

      return user;
    } catch (error) {
      // If it's already our custom exception, just rethrow it
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      // Otherwise let the global exception filter handle it
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      // First check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id }
      });
      
      if (!existingUser) {
        throw new EntityNotFoundException('User', id);
      }
      
      // If password is being updated, hash it
      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      // Extract profile data if present
      const { profile, ...userData } = updateUserDto;

      const user = await this.prisma.user.update({
        where: { id },
        data: userData,
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Update profile if profile data is provided
      if (profile && this.profilesService) {
        const existingProfile = await this.prisma.profile.findUnique({
          where: { userId: id },
        });

        if (existingProfile) {
          await this.profilesService.update(existingProfile.id, profile);
        } else {
          // Add required fields if they're missing when creating a new profile
          const createProfileDto = {
            firstName: profile.firstName || 'Default',
            lastName: profile.lastName || 'User',
            ...profile
          };
          await this.profilesService.create(id, createProfileDto);
        }
      }

      return user;
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
      // First check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id }
      });
      
      if (!existingUser) {
        throw new EntityNotFoundException('User', id);
      }
      
      return await this.prisma.user.delete({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });
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