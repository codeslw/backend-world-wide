import { Module } from '@nestjs/common';
import { ScholarshipsService } from './scholarships.service';
import { ScholarshipsController } from './scholarships.controller';
import { PrismaService } from '../db/prisma.service';

@Module({
    controllers: [ScholarshipsController],
    providers: [ScholarshipsService, PrismaService],
})
export class ScholarshipsModule { }
