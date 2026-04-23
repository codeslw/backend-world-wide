import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateStudyLanguageDto } from './dto/create-study-language.dto';
import { UpdateStudyLanguageDto } from './dto/update-study-language.dto';
import { EntityNotFoundException } from '../common/exceptions/app.exceptions';

@Injectable()
export class StudyLanguagesService {
  constructor(private prisma: PrismaService) {}

  async create(createStudyLanguageDto: CreateStudyLanguageDto) {
    return this.prisma.studyLanguage.create({
      data: createStudyLanguageDto,
    });
  }

  async findAll() {
    return this.prisma.studyLanguage.findMany({
      orderBy: { nameEn: 'asc' },
    });
  }

  async findOne(id: string) {
    const studyLanguage = await this.prisma.studyLanguage.findUnique({
      where: { id },
    });

    if (!studyLanguage) {
      throw new EntityNotFoundException('StudyLanguage', id);
    }

    return studyLanguage;
  }

  async update(id: string, updateStudyLanguageDto: UpdateStudyLanguageDto) {
    await this.findOne(id);
    return this.prisma.studyLanguage.update({
      where: { id },
      data: updateStudyLanguageDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.studyLanguage.delete({
      where: { id },
    });
  }
}
