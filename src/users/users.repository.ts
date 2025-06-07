import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    // Extract profile data to handle it separately
    const { profile, ...userData } = createUserDto;

    return this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        // Only create profile if it exists
        ...(profile && {
          profile: {
            create: profile,
          },
        }),
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
