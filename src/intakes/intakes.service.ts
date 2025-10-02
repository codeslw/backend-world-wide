import { Injectable } from '@nestjs/common';
import { CreateIntakeDto } from './dto/create-intake.dto';
import { UpdateIntakeDto } from './dto/update-intake.dto';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class IntakesService {
  constructor(private prisma: PrismaService) {}

  create(createIntakeDto: CreateIntakeDto) {
    return this.prisma.intake.create({ data: createIntakeDto });
  }

  findAll() {
    return this.prisma.intake.findMany();
  }

  findOne(id: string) {
    return this.prisma.intake.findUnique({ where: { id } });
  }

  update(id: string, updateIntakeDto: UpdateIntakeDto) {
    return this.prisma.intake.update({
      where: { id },
      data: updateIntakeDto,
    });
  }

  remove(id: string) {
    return this.prisma.intake.delete({ where: { id } });
  }
}
