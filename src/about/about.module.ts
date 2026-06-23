import { Module } from '@nestjs/common';
import { AboutController } from './about.controller';
import { AboutService } from './about.service';
import { AboutPageModule } from './about-page/about-page.module';
import { FoundersModule } from './founders/founders.module';
import { MilestonesModule } from './milestones/milestones.module';
import { TeamMembersModule } from './team-members/team-members.module';
import { CertificatesModule } from './certificates/certificates.module';

@Module({
  imports: [
    AboutPageModule,
    FoundersModule,
    MilestonesModule,
    TeamMembersModule,
    CertificatesModule,
  ],
  controllers: [AboutController],
  providers: [AboutService],
})
export class AboutModule {}
