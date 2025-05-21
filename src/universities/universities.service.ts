import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterService } from '../common/filters/filter.service';
import { FilterOptions, PaginationOptions } from '../common/filters/filter.interface';
import { EntityNotFoundException, InvalidDataException } from '../common/exceptions/app.exceptions';
import { UniversityFilterDto } from './dto/university-filter.dto';
import { UniversityResponseDto } from './dto/university-response.dto';

@Injectable()
export class UniversitiesService {
  constructor(
    private prisma: PrismaService,
    private filterService: FilterService
  ) {}

  async create(createUniversityDto: CreateUniversityDto): Promise<UniversityResponseDto> {
    const { programs, countryCode, cityId, ...universityData } = createUniversityDto;

    // Validate that all provided programIds exist
    await this.validateProgramIds(programs.map(p => p.programId));

    try {
      const createdUniversity = await this.prisma.university.create({
        data: {
          ...universityData,
          country: { connect: { code: countryCode } },
          city: { connect: { id: cityId } },
          universityPrograms: {
            create: programs.map(program => ({
              program: { connect: { id: program.programId } },
              tuitionFee: program.tuitionFee,
              tuitionFeeCurrency: program.tuitionFeeCurrency || 'USD',
            })),
          },
        },
        include: {
          country: true,
          city: true,
          universityPrograms: {
            include: {
              program: true, // Include program details
            },
          },
        },
      });
      return this.mapToResponseDto(createdUniversity);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') { // Unique constraint violation
          throw new InvalidDataException(`University creation failed due to duplicate data: ${error.meta?.target}`);
        } else if (error.code === 'P2025') { // Foreign key constraint failed
          throw new InvalidDataException(`Invalid country code (${countryCode}) or city ID (${cityId}) provided.`);
        }
      }
      console.error("Error creating university:", error);
      throw error; // Rethrow other errors
    }
  }

  // Added method signature for bulk creation
  async createMany(createManyUniversitiesDto: CreateUniversityDto[]): Promise<UniversityResponseDto[]> {
    // Implementation pending: 
    // - Iterate through createManyUniversitiesDto array
    // - Validate each DTO (perhaps using validateProgramIds for all programs first)
    // - Use Prisma's createMany or transaction for batch insertion
    // - Map results to UniversityResponseDto array
    // - Handle potential errors for individual or batch operations
    console.log("createMany called with:", createManyUniversitiesDto);
    // Placeholder implementation - replace with actual logic
    const createdUniversities = await Promise.all(
      createManyUniversitiesDto.map(dto => this.create(dto))
    );
    return createdUniversities;
  }

  async findAll(
    filterDto: UniversityFilterDto,
    lang: string = 'uz',
  ) {
    try {
      const paginationDto: PaginationDto = { page: filterDto.page, limit: filterDto.limit };
      const { programs: programFilters, ...otherFilters } = filterDto;

      const filterOptions: FilterOptions = {
        filters: [
          { field: 'countryCode', queryParam: 'countryCode' },
          { field: 'cityId', queryParam: 'cityId' },
          { field: 'type', queryParam: 'type' },
          { field: 'ranking', queryParam: 'minRanking', operator: 'gte', transform: (value) => parseInt(value) },
          { field: 'ranking', queryParam: 'maxRanking', operator: 'lte', transform: (value) => parseInt(value) },
          { field: 'established', queryParam: 'minEstablished', operator: 'gte', transform: (value) => parseInt(value) },
          { field: 'established', queryParam: 'maxEstablished', operator: 'lte', transform: (value) => parseInt(value) },
          { field: 'acceptanceRate', queryParam: 'minAcceptanceRate', operator: 'gte', transform: (value) => parseFloat(value) },
          { field: 'acceptanceRate', queryParam: 'maxAcceptanceRate', operator: 'lte', transform: (value) => parseFloat(value) },
          { field: 'avgApplicationFee', queryParam: 'minApplicationFee', operator: 'gte', transform: (value) => parseFloat(value) },
          { field: 'avgApplicationFee', queryParam: 'maxApplicationFee', operator: 'lte', transform: (value) => parseFloat(value) },
          { field: 'createdAt', queryParam: 'createdAfter', operator: 'gte', transform: (value) => new Date(value) },
          { field: 'createdAt', queryParam: 'createdBefore', operator: 'lte', transform: (value) => new Date(value) },
          { field: 'id', queryParam: 'ids', operator: 'in', isArray: true },
          // Updated program filter to target the join table
          {
            field: 'universityPrograms',
            queryParam: 'programs', // Kept query param name for consistency
            operator: 'some',
            transform: (value) => {
              let programIds: string[] = [];
              if (Array.isArray(value)) {
                programIds = value;
              } else if (typeof value === 'string') {
                programIds = value.split(',').filter(id => id);
              }
              if (programIds.length > 0) {
                return { programId: { in: programIds } };
              }
              return undefined; // Don't filter if no valid program IDs are provided
            }
          }
        ],
        searchFields: [
          'nameUz', 'nameRu', 'nameEn',
          'descriptionUz', 'descriptionRu', 'descriptionEn',
          'website'
        ],
        searchMode: 'contains',
        caseSensitive: false
      };

      const query = { ...otherFilters, programs: programFilters }; // Pass original filter DTO
      const where = this.filterService.buildFilterQuery(query, filterOptions);

      const paginationOptions: PaginationOptions = {
        defaultLimit: 10,
        maxLimit: 300,
        defaultSortField: 'ranking', // Consider allowing sort by other fields
        defaultSortDirection: 'asc'
      };

      const result = await this.filterService.applyPagination(
        this.prisma.university,
        where,
        paginationDto,
        {
          country: true,
          city: true,
          universityPrograms: {
            include: {
              program: { select: { id: true, titleUz: true, titleRu: true, titleEn: true } }, // Select specific program fields
            },
          },
        },
        undefined,
        paginationOptions,
      );

      const localizedData = result.data.map(university => this.localizeAndMapUniversity(university, lang));

      return {
        data: localizedData,
        meta: result.meta
      };
    } catch (error) {
      console.error("Error finding universities:", error);
      throw error;
    }
  }

  async findOne(id: string, lang: string = 'uz'): Promise<UniversityResponseDto> {
    try {
      const university = await this.prisma.university.findUnique({
        where: { id },
        include: {
          country: true,
          city: true,
          universityPrograms: {
            include: {
              program: true, // Include full program details
            },
          },
        },
      });

      if (!university) {
        throw new EntityNotFoundException('University', id);
      }

      return this.localizeAndMapUniversity(university, lang);
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      console.error(`Error finding university with id ${id}:`, error);
      throw error;
    }
  }

  async update(id: string, updateUniversityDto: UpdateUniversityDto): Promise<UniversityResponseDto> {
    const { programs, countryCode, cityId, ...otherFields } = updateUniversityDto;

    // 1. Check if university exists
    const existingUniversity = await this.prisma.university.findUnique({
      where: { id },
      include: { universityPrograms: true } // Include existing program relations
    });
    if (!existingUniversity) {
      throw new EntityNotFoundException('University', id);
    }

    // 2. Validate incoming program IDs if programs are being updated
    if (programs) {
      await this.validateProgramIds(programs.map(p => p.programId));
    }

    try {
      const updatedUniversity = await this.prisma.$transaction(async (tx) => {
        // 3. Update scalar fields and simple relations (country, city)
        const dataToUpdate: Prisma.UniversityUpdateInput = { ...otherFields };
        if (countryCode !== undefined) {
          dataToUpdate.country = { connect: { code: countryCode } };
        }
        if (cityId !== undefined) {
          dataToUpdate.city = { connect: { id: cityId } };
        }

        const universityUpdateResult = await tx.university.update({
          where: { id },
          data: dataToUpdate,
        });

        // 4. Handle UniversityProgram updates if programs array is provided
        if (programs) {
          const existingProgramIds = new Set(existingUniversity.universityPrograms.map(up => up.programId));
          const incomingProgramsMap = new Map(programs.map(p => [p.programId, p]));

          // Deletions: Find programs in existing set but not in incoming map
          const programsToDelete = existingUniversity.universityPrograms
            .filter(up => !incomingProgramsMap.has(up.programId))
            .map(up => up.id);

          if (programsToDelete.length > 0) {
            await tx.universityProgram.deleteMany({ where: { id: { in: programsToDelete } } });
          }

          // Upserts: Iterate through incoming programs
          for (const [programId, programData] of incomingProgramsMap) {
            const existingEntry = existingUniversity.universityPrograms.find(up => up.programId === programId);

            await tx.universityProgram.upsert({
              where: { id: existingEntry?.id ?? '' }, // Use existing ID if available, otherwise dummy ID for create
              create: {
                universityId: id,
                programId: programId,
                tuitionFee: programData.tuitionFee,
                tuitionFeeCurrency: programData.tuitionFeeCurrency || 'USD',
              },
              update: {
                tuitionFee: programData.tuitionFee,
                tuitionFeeCurrency: programData.tuitionFeeCurrency || 'USD',
              },
            });
          }
        }

        // Fetch the final state after all updates in the transaction
        return tx.university.findUnique({
          where: { id },
          include: {
            country: true,
            city: true,
            universityPrograms: {
              include: {
                program: true,
              },
            },
          },
        });
      });

      // Ensure we return non-null, though findUnique after successful update should guarantee it
      if (!updatedUniversity) {
           throw new Error('Failed to retrieve updated university after transaction.');
      }

      return this.localizeAndMapUniversity(updatedUniversity, 'uz'); // Or get lang from context

    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new InvalidDataException(`Update failed: Invalid country code, city ID, or program ID provided.`);
        }
      }
      console.error(`Error updating university with id ${id}:`, error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Check if university exists before attempting delete
      const university = await this.prisma.university.findUnique({
        where: { id },
        include: {
          universityPrograms: true,
          miniApplications: true
        }
      });
      
      if (!university) {
        throw new EntityNotFoundException('University', id);
      }

      // Check if there are related records that would prevent deletion
      if (university.universityPrograms.length > 0) {
        throw new InvalidDataException(
          'Cannot delete university with associated programs. Please remove university-program associations first.',
          { reason: 'RELATED_PROGRAMS_EXIST', count: university.universityPrograms.length }
        );
      }

      if (university.miniApplications.length > 0) {
        throw new InvalidDataException(
          'Cannot delete university with associated mini-applications. Please handle mini-applications first.',
          { reason: 'RELATED_MINI_APPLICATIONS_EXIST', count: university.miniApplications.length }
        );
      }

      // Now safe to delete
      await this.prisma.university.delete({ where: { id } });
    } catch (error) {
      if (error instanceof EntityNotFoundException || error instanceof InvalidDataException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Handles case where it might have been deleted between check and delete call
          throw new EntityNotFoundException('University', id);
        }
        if (error.code === 'P2003') {
          // Foreign key constraint failed
          throw new InvalidDataException(
            'Cannot delete university because it has related records.',
            { reason: 'FOREIGN_KEY_CONSTRAINT', errorCode: error.code }
          );
        }
      }
      console.error(`Error deleting university with id ${id}:`, error);
      throw error;
    }
  }

  // Add this method after the remove() method
  async removeUniversityProgram(universityId: string, programId: string): Promise<void> {
    try {
      // Check if the association exists
      const universityProgram = await this.prisma.universityProgram.findFirst({
        where: {
          universityId,
          programId
        }
      });

      if (!universityProgram) {
        throw new EntityNotFoundException('University Program association');
      }

      // Delete the association
      await this.prisma.universityProgram.delete({
        where: { id: universityProgram.id }
      });
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      console.error(`Error removing university-program association:`, error);
      throw new InvalidDataException(
        'Failed to remove university-program association',
        { universityId, programId }
      );
    }
  }

  // --- Helper Methods ---

  private async validateProgramIds(programIds: string[]): Promise<void> {
    if (!programIds || programIds.length === 0) {
      return; // Nothing to validate
    }
    const existingPrograms = await this.prisma.program.findMany({
      where: { id: { in: programIds } },
      select: { id: true },
    });
    const existingProgramIdsSet = new Set(existingPrograms.map(p => p.id));
    const invalidIds = programIds.filter(id => !existingProgramIdsSet.has(id));
    if (invalidIds.length > 0) {
      throw new InvalidDataException(`Invalid program IDs provided: ${invalidIds.join(', ')}`);
    }
  }

  private mapToResponseDto(university: any): UniversityResponseDto {
    // Explicitly map fields to ensure correct structure and types
    return {
      id: university.id,
      nameUz: university.nameUz,
      nameRu: university.nameRu,
      nameEn: university.nameEn,
      established: university.established,
      type: university.type,
      avgApplicationFee: university.avgApplicationFee,
      countryCode: university.countryCode,
      cityId: university.cityId,
      descriptionUz: university.descriptionUz,
      descriptionRu: university.descriptionRu,
      descriptionEn: university.descriptionEn,
      // Format dates as ISO strings or YYYY-MM-DD
      winterIntakeDeadline: university.winterIntakeDeadline?.toISOString().split('T')[0] ?? null,
      autumnIntakeDeadline: university.autumnIntakeDeadline?.toISOString().split('T')[0] ?? null,
      ranking: university.ranking,
      studentsCount: university.studentsCount,
      acceptanceRate: university.acceptanceRate,
      website: university.website,
      email: university.email,
      phone: university.phone,
      address: university.address,
      photoUrl: university.photoUrl,
      createdAt: university.createdAt,
      updatedAt: university.updatedAt,
      universityPrograms: university.universityPrograms?.map(up => ({
        programId: up.programId,
        // Include localized program title if needed, based on lang
        titleUz: up.program?.titleUz, // Example: use Uzbek title
        // titleRu: up.program?.titleRu,
        // titleEn: up.program?.titleEn,
        tuitionFee: up.tuitionFee,
        tuitionFeeCurrency: up.tuitionFeeCurrency,
      })) || [],
    };
  }

  // Combines localization and mapping
  private localizeAndMapUniversity(university: any, lang: string): UniversityResponseDto {
    const localized = this.localizeUniversity(university, lang);
    return this.mapToResponseDto(localized);
  }

  // Keep localization helpers, but ensure they handle the new structure if needed
  private localizeUniversity(university: any, lang: string) {
    if (!university) return null;
    // Localize nested Country, City, and Program within UniversityProgram
    const localizedCountry = this.localizeCountry(university.country, lang);
    const localizedCity = this.localizeCity(university.city, lang);
    const localizedPrograms = university.universityPrograms?.map(up => ({
      ...up,
      program: this.localizeProgram(up.program, lang),
    })) || [];

    return {
      ...university,
      country: localizedCountry,
      city: localizedCity,
      universityPrograms: localizedPrograms,
      // No direct name/description on university to localize here
    };
  }

  private localizeCountry(country: any, lang: string) {
    if (!country) return null;
    const name = country[`name${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || country.nameUz;
    return { ...country, name }; // Return all fields + localized name
  }

  private localizeCity(city: any, lang: string) {
    if (!city) return null;
    const name = city[`name${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || city.nameUz;
    const description = city[`description${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || city.descriptionUz;
    return { ...city, name, description };
  }

  private localizeProgram(program: any, lang: string) {
    if (!program) return null;
    const title = program[`title${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || program.titleUz;
    const description = program[`description${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || program.descriptionUz;
    return { ...program, title, description };
  }

  // Note: createMany is omitted for brevity but would need similar updates as `create`
  // async createMany(createUniversityDtos: CreateUniversityDto[]) { ... }
} 