import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    // Extract profile data to handle it separately
    const { profile, ...userData } = createUserDto;

    const data: Prisma.UserCreateInput = {
      ...userData,
      password: hashedPassword,
    };

    if (profile) {
      const {
        educationHistory,
        languageCertificates,
        standardizedTests,
        ...profileData
      } = profile;
      data.profile = {
        create: {
          ...profileData,
          educationHistory: {
            create: educationHistory,
          },
          languageCertificates: {
            create: languageCertificates.map((cert) => ({
              ...cert,
              certificateUrl: cert.certificateUrl || '',
            })),
          },
          standardizedTests: {
            create: standardizedTests,
          },
        },
      };
    }

    return this.prisma.user.create({
      data,
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
