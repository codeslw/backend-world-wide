import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { DigitalOceanService } from '../../digital-ocean/digital-ocean.service';
import { TeamMember } from '@prisma/client';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { RevalidationService } from '../revalidation.service';

@Injectable()
export class TeamMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly digitalOceanService: DigitalOceanService,
    private readonly revalidation: RevalidationService,
  ) {}

  async create(dto: CreateTeamMemberDto): Promise<TeamMember> {
    const member = await this.prisma.teamMember.create({
      data: {
        ...dto,
        photoUrl: this.digitalOceanService.normalizeToPublicUrl(dto.photoUrl),
      },
    });
    this.revalidation.revalidateAbout();
    return this.normalize(member);
  }

  async findAll(): Promise<TeamMember[]> {
    const members = await this.prisma.teamMember.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return members.map((m) => this.normalize(m));
  }

  async findOne(id: string): Promise<TeamMember> {
    const member = await this.prisma.teamMember.findUnique({ where: { id } });
    if (!member) throw new NotFoundException(`Team member ${id} not found`);
    return this.normalize(member);
  }

  async update(id: string, dto: UpdateTeamMemberDto): Promise<TeamMember> {
    const existing = await this.prisma.teamMember.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Team member ${id} not found`);

    const updated = await this.prisma.teamMember.update({
      where: { id },
      data: {
        ...dto,
        photoUrl:
          dto.photoUrl === undefined
            ? undefined
            : this.digitalOceanService.normalizeToPublicUrl(dto.photoUrl),
      },
    });
    this.revalidation.revalidateAbout();
    return this.normalize(updated);
  }

  async remove(id: string): Promise<TeamMember> {
    const existing = await this.prisma.teamMember.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Team member ${id} not found`);
    const removed = await this.prisma.teamMember.delete({ where: { id } });
    this.revalidation.revalidateAbout();
    return removed;
  }

  private normalize(member: TeamMember): TeamMember {
    return {
      ...member,
      photoUrl: this.digitalOceanService.normalizeToPublicUrl(member.photoUrl),
    };
  }
}
