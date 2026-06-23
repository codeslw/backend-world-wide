import { Injectable } from '@nestjs/common';
import { AboutPageService } from './about-page/about-page.service';
import { FoundersService } from './founders/founders.service';
import { MilestonesService } from './milestones/milestones.service';
import { TeamMembersService } from './team-members/team-members.service';
import { CertificatesService } from './certificates/certificates.service';

type Lang = 'uz' | 'ru' | 'en';

@Injectable()
export class AboutService {
  constructor(
    private readonly aboutPageService: AboutPageService,
    private readonly foundersService: FoundersService,
    private readonly milestonesService: MilestonesService,
    private readonly teamMembersService: TeamMembersService,
    private readonly certificatesService: CertificatesService,
  ) {}

  /**
   * One localized payload for the public About page. Picks the requested
   * language for each localized field, falling back to en → uz when empty.
   */
  async getAggregate(lang: Lang) {
    const [page, founders, milestones, team, certificates] = await Promise.all([
      this.aboutPageService.ensure(),
      this.foundersService.findAll(),
      this.milestonesService.findAll(),
      this.teamMembersService.findAll(),
      this.certificatesService.findAll(),
    ]);

    const pick = (obj: Record<string, any>, base: string): string | null =>
      this.pick(obj, base, lang);

    return {
      page: {
        heroTitle: pick(page, 'heroTitle'),
        heroSubtitle: pick(page, 'heroSubtitle'),
        heroImageUrl: page.heroImageUrl,
        introHeading: pick(page, 'introHeading'),
        introBody: pick(page, 'introBody'),
        operatorStatement: pick(page, 'operatorStatement'),
        foundedYear: page.foundedYear,
        platformLaunch: page.platformLaunch,
        founderHeading: pick(page, 'founderHeading'),
        milestonesHeading: pick(page, 'milestonesHeading'),
        teamHeading: pick(page, 'teamHeading'),
        certificatesHeading: pick(page, 'certificatesHeading'),
      },
      founders: founders.map((f) => ({
        id: f.id,
        name: f.name,
        role: pick(f, 'role'),
        bio: pick(f, 'bio'),
        photoUrl: f.photoUrl,
        linkedinUrl: f.linkedinUrl,
      })),
      milestones: milestones.map((m) => ({
        id: m.id,
        year: m.year,
        title: pick(m, 'title'),
        description: pick(m, 'description'),
      })),
      team: team.map((t) => ({
        id: t.id,
        name: t.name,
        position: pick(t, 'position'),
        role: pick(t, 'role'),
        group: pick(t, 'group'),
        photoUrl: t.photoUrl,
        linkedinUrl: t.linkedinUrl,
      })),
      certificates: certificates.map((c) => ({
        id: c.id,
        title: pick(c, 'title'),
        issuer: pick(c, 'issuer'),
        imageUrl: c.imageUrl,
        isFeatured: c.isFeatured,
      })),
    };
  }

  private pick(
    obj: Record<string, any>,
    base: string,
    lang: Lang,
  ): string | null {
    const cap = (l: string) => l.charAt(0).toUpperCase() + l.slice(1);
    return (
      obj[`${base}${cap(lang)}`] ||
      obj[`${base}En`] ||
      obj[`${base}Uz`] ||
      obj[`${base}Ru`] ||
      null
    );
  }
}
