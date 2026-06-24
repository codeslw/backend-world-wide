import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { DigitalOceanService } from '../../digital-ocean/digital-ocean.service';
import { Certificate } from '@prisma/client';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { RevalidationService } from '../revalidation.service';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly digitalOceanService: DigitalOceanService,
    private readonly revalidation: RevalidationService,
  ) {}

  async create(dto: CreateCertificateDto): Promise<Certificate> {
    const certificate = await this.prisma.certificate.create({
      data: {
        ...dto,
        imageUrl: this.digitalOceanService.normalizeToPublicUrl(dto.imageUrl),
      },
    });
    this.revalidation.revalidateAbout();
    return this.normalize(certificate);
  }

  async findAll(featured?: boolean): Promise<Certificate[]> {
    const certificates = await this.prisma.certificate.findMany({
      where: featured === undefined ? undefined : { isFeatured: featured },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return certificates.map((c) => this.normalize(c));
  }

  async findOne(id: string): Promise<Certificate> {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id },
    });
    if (!certificate) throw new NotFoundException(`Certificate ${id} not found`);
    return this.normalize(certificate);
  }

  async update(id: string, dto: UpdateCertificateDto): Promise<Certificate> {
    const existing = await this.prisma.certificate.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Certificate ${id} not found`);

    const updated = await this.prisma.certificate.update({
      where: { id },
      data: {
        ...dto,
        imageUrl:
          dto.imageUrl === undefined
            ? undefined
            : this.digitalOceanService.normalizeToPublicUrl(dto.imageUrl),
      },
    });
    this.revalidation.revalidateAbout();
    return this.normalize(updated);
  }

  async remove(id: string): Promise<Certificate> {
    const existing = await this.prisma.certificate.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Certificate ${id} not found`);
    const removed = await this.prisma.certificate.delete({ where: { id } });
    this.revalidation.revalidateAbout();
    return removed;
  }

  private normalize(certificate: Certificate): Certificate {
    return {
      ...certificate,
      imageUrl: this.digitalOceanService.normalizeToPublicUrl(
        certificate.imageUrl,
      ),
    };
  }
}
