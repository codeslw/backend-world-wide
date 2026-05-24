import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { DigitalOceanService } from '../digital-ocean/digital-ocean.service';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { EntityNotFoundException, ForbiddenActionException } from '../common/exceptions/app.exceptions';

@Injectable()
export class PartnerCompanyService {
  constructor(
    private prisma: PrismaService,
    private digitalOcean: DigitalOceanService,
  ) {}

  async getProfile(organizationId: string) {
    const org = await this.prisma.partnerOrganization.findUnique({
      where: { id: organizationId },
    });
    if (!org) throw new EntityNotFoundException('PartnerOrganization', organizationId);
    return this.normalizeLogoUrl(org);
  }

  async updateProfile(organizationId: string, partnerRole: string, dto: UpdateCompanyProfileDto) {
    if (partnerRole === 'MEMBER') {
      throw new ForbiddenActionException('Only Owner or Manager can edit company profile');
    }
    const org = await this.prisma.partnerOrganization.findUnique({
      where: { id: organizationId },
    });
    if (!org) throw new EntityNotFoundException('PartnerOrganization', organizationId);
    return this.prisma.partnerOrganization.update({
      where: { id: organizationId },
      data: dto,
    });
  }

  async uploadLogo(organizationId: string, partnerRole: string, file: Express.Multer.File) {
    if (partnerRole === 'MEMBER') {
      throw new ForbiddenActionException('Only Owner or Manager can upload company logo');
    }
    const org = await this.prisma.partnerOrganization.findUnique({
      where: { id: organizationId },
    });
    if (!org) throw new EntityNotFoundException('PartnerOrganization', organizationId);

    const key = await this.digitalOcean.uploadFile(file, 'logos');
    const logoUrl = this.digitalOcean.getPublicUrl(key);

    await this.prisma.partnerOrganization.update({
      where: { id: organizationId },
      data: { logoUrl },
    });

    return { logoUrl: this.normalizeLogoUrl({ logoUrl }).logoUrl };
  }

  async uploadRegistrationCertificate(organizationId: string, partnerRole: string, file: Express.Multer.File) {
    if (partnerRole === 'MEMBER') {
      throw new ForbiddenActionException('Only Owner or Manager can upload registration certificate');
    }
    const org = await this.prisma.partnerOrganization.findUnique({
      where: { id: organizationId },
    });
    if (!org) throw new EntityNotFoundException('PartnerOrganization', organizationId);

    const key = await this.digitalOcean.uploadFile(file, 'certificates');
    const registrationCertificateUrl = this.digitalOcean.getPublicUrl(key);

    await this.prisma.partnerOrganization.update({
      where: { id: organizationId },
      data: { registrationCertificateUrl },
    });

    return { registrationCertificateUrl };
  }

  private normalizeLogoUrl<T extends { logoUrl: string | null }>(entity: T) {
    if (!entity.logoUrl) {
      return entity;
    }

    return {
      ...entity,
      logoUrl: entity.logoUrl.replace(
        /^https:\/\/([^/]+)\.https?:\/\//,
        'https://$1.',
      ),
    };
  }
}
