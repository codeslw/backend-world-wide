import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateMiniApplicationDto } from './dto/create-mini-application.dto';
import { UpdateMiniApplicationDto } from './dto/update-mini-application.dto';
import { MiniApplication, MiniApplicationStatus } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterService } from '../common/filters/filter.service';
import {
  FilterOptions,
  PaginationOptions,
} from '../common/filters/filter.interface';
import { Prisma } from '@prisma/client';
import { InvalidDataException } from '../common/exceptions/app.exceptions';

@Injectable()
export class MiniApplicationsService {
  constructor(
    private prisma: PrismaService,
    private filterService: FilterService,
  ) {}

  async create(
    createMiniApplicationDto: CreateMiniApplicationDto,
  ): Promise<MiniApplication> {
    return this.prisma.miniApplication.create({
      data: createMiniApplicationDto,
    });
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<{ data: MiniApplication[]; meta: any }> {
    // Define filters (can be extended based on query parameters)
    const filterOptions: FilterOptions = {
      filters: [
        // Example: filter by email if query param 'email' is present
        // { field: 'email', queryParam: 'email', operator: 'contains' },
      ],
      // Optional: Add search fields if a global 'search' query param is expected
      // searchFields: ['firstName', 'lastName', 'email'],
    };

    // Build the Prisma 'where' clause based on query parameters and filter definitions
    const where = this.filterService.buildFilterQuery(
      paginationDto,
      filterOptions,
    );

    // Define pagination/sorting configuration
    const paginationOptions: PaginationOptions = {
      defaultSortField: 'createdAt',
      defaultSortDirection: 'desc',
      defaultLimit: 10,
      maxLimit: 100,
    };

    // Use applyPagination to fetch data and metadata
    return this.filterService.applyPagination<MiniApplication>(
      this.prisma.miniApplication,
      where,
      paginationDto,
      { university: true }, // Include related university data
      undefined, // Let applyPagination handle sorting based on DTO
      paginationOptions,
    );
  }

  async findOne(id: string): Promise<MiniApplication> {
    const miniApplication = await this.prisma.miniApplication.findUnique({
      where: { id },
    });
    if (!miniApplication) {
      throw new NotFoundException(`MiniApplication with ID "${id}" not found`);
    }
    return miniApplication;
  }

  async update(
    id: string,
    updateMiniApplicationDto: UpdateMiniApplicationDto,
  ): Promise<MiniApplication> {
    // Check if the mini-application exists first
    await this.findOne(id);

    // If universityId is being updated, check if the new university exists

    try {
      return await this.prisma.miniApplication.update({
        where: { id },
        data: updateMiniApplicationDto,
      });
    } catch (error) {
      // Handle potential errors, e.g., Prisma specific errors
      throw error; // Re-throw for global exception filter or handle specifically
    }
  }

  async remove(id: string): Promise<MiniApplication> {
    // Check if the mini-application exists first
    await this.findOne(id);

    try {
      return await this.prisma.miniApplication.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          // Foreign key constraint error
          throw new InvalidDataException(
            'Cannot delete mini-application because it has relationships that prevent deletion.',
            { reason: 'FOREIGN_KEY_CONSTRAINT', errorCode: error.code },
          );
        }
      }
      throw error; // Re-throw for global exception filter or handle specifically
    }
  }
}
