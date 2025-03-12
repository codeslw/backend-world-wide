import { Module } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramsController } from './programs.controller';
import { PrismaService } from '../db/prisma.service';

@Module({
  imports: [],
  controllers: [ProgramsController],
  providers: [ProgramsService, PrismaService],
  exports: [ProgramsService],
})
export class ProgramsModule {} 