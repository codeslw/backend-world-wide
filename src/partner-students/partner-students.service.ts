import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreatePartnerStudentDto } from './dto/create-partner-student.dto';
import { UpdatePartnerStudentDto } from './dto/update-partner-student.dto';

@Injectable()
export class PartnerStudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(partnerId: string, createStudentDto: CreatePartnerStudentDto) {
    const { dateOfBirth, passportExpiryDate, ...rest } = createStudentDto;

    // Strip undefined fields so Prisma doesn't see partner: undefined
    const data: any = { partnerId, dateOfBirth: new Date(dateOfBirth), passportExpiryDate: new Date(passportExpiryDate) };
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) data[k] = v;
    }

    return this.prisma.partnerStudent.create({ data });
  }

  async findAllByPartner(partnerId: string) {
    return this.prisma.partnerStudent.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.partnerStudent.findMany({
      include: {
        partner: {
          select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, partnerId?: string) {
    const whereCondition: any = { id };
    if (partnerId) {
      whereCondition.partnerId = partnerId;
    }
    const student = await this.prisma.partnerStudent.findUnique({
      where: whereCondition,
    });
    if (!student) {
      throw new NotFoundException(`Student not found`);
    }
    return student;
  }

  async update(id: string, updateStudentDto: UpdatePartnerStudentDto, partnerId?: string) {
    await this.findOne(id, partnerId); // Ensure exists and belongs to partner

    const { dateOfBirth, passportExpiryDate, ...rest } = updateStudentDto;

    // Remove undefined values to avoid Prisma relation errors
    const dataToUpdate: any = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v !== undefined),
    );
    if (dateOfBirth) dataToUpdate.dateOfBirth = new Date(dateOfBirth);
    if (passportExpiryDate) dataToUpdate.passportExpiryDate = new Date(passportExpiryDate);

    return this.prisma.partnerStudent.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(id: string, partnerId?: string) {
    await this.findOne(id, partnerId);
    return this.prisma.partnerStudent.delete({
      where: { id },
    });
  }
}
