import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateTuitionFeeDto } from './dto/create-tuition-fee.dto';
import { UpdateTuitionFeeDto } from './dto/update-tuition-fee.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterService } from '../common/filters/filter.service';
import { FilterOptions, PaginationOptions } from '../common/filters/filter.interface';

@Injectable()
export class TuitionFeesService {
  constructor(
    private prisma: PrismaService,
    private filterService: FilterService
  ) {}

  async create(createTuitionFeeDto: CreateTuitionFeeDto) {
    return this.prisma.tuitionFee.create({
      data: {
        minAmount: createTuitionFeeDto.minAmount,
        maxAmount: createTuitionFeeDto.maxAmount,
        currency: createTuitionFeeDto.currency
      }
    });
  }

  async findAll(paginationDto?: PaginationDto) {
    const filterOptions = {
      filters: [
        { field: 'currency', queryParam: 'currency' },
        { field: 'minAmount', queryParam: 'minAmount', operator: 'gte', transform: Number },
        { field: 'maxAmount', queryParam: 'maxAmount', operator: 'lte', transform: Number }
      ],
      searchMode: 'contains'
    };
    
    const where = this.filterService.buildFilterQuery(paginationDto || {}, filterOptions as FilterOptions);
    
    return this.filterService.applyPagination(
      this.prisma.tuitionFee,
      where,
      paginationDto
    );
  }

  async findOne(id: number) {
    const tuitionFee = await this.prisma.tuitionFee.findUnique({
      where: { id }
    });
    
    if (!tuitionFee) {
      throw new NotFoundException(`Tuition fee with ID ${id} not found`);
    }
    
    return tuitionFee;
  }

  async update(id: number, updateTuitionFeeDto: UpdateTuitionFeeDto) {
    try {
      return await this.prisma.tuitionFee.update({
        where: { id },
        data: updateTuitionFeeDto
      });
    } catch (error) {
      throw new NotFoundException(`Tuition fee with ID ${id} not found`);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.tuitionFee.delete({
        where: { id }
      });
    } catch (error) {
      throw new NotFoundException(`Tuition fee with ID ${id} not found`);
    }
  }
} 