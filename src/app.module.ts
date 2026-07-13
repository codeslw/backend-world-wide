import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaService } from './db/prisma.service';
import { DbModule } from './db/db.module';
import { ProgramsModule } from './programs/programs.module';
import { CountriesModule } from './countries/countries.module';
import { CitiesModule } from './cities/cities.module';
import { CommonModule } from './common/common.module';
import { UniversitiesModule } from './universities/universities.module';
import { DigitalOceanService } from './digital-ocean/digital-ocean.service';
import { DigitalOceanModule } from './digital-ocean/digital-ocean.module';
import { IntakesModule } from './intakes/intakes.module';
import { FilesModule } from './files/files.module';
import { ChatModule } from './chat/chat.module';
import { CatalogModule } from './catalog/catalog.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ApplicationsModule } from './applications/applications.module';
import { MiniApplicationsModule } from './modules/mini-applications.module';
import { ValidityModule } from './validity/validity.module';
import { StatisticsModule } from './statistics/statistics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ScholarshipsModule } from './scholarships/scholarships.module';
import { AdmissionRequirementsModule } from './admission-requirements/admission-requirements.module';
import { CampusesModule } from './campuses/campuses.module';
import { CacheModule } from '@nestjs/cache-manager';

import { AgencyServicesModule } from './agency-services/agency-services.module';
import { PartnerStudentsModule } from './partner-students/partner-students.module';
import { PartnerApplicationsModule } from './partner-applications/partner-applications.module';
import { StudentDocumentsModule } from './student-documents/student-documents.module';
import { ApplicationProcessModule } from './application-process/application-process.module';
import { ApplicationDocumentsModule } from './application-documents/application-documents.module';
import { StudyLanguagesModule } from './study-languages/study-languages.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PartnerOrganizationsModule } from './partner-organizations/partner-organizations.module';
import { PartnerMembersModule } from './partner-members/partner-members.module';
import { PartnerCompanyModule } from './partner-company/partner-company.module';
import { PartnerAuditModule } from './partner-audit/partner-audit.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';
import { AboutModule } from './about/about.module';
import { CurrenciesModule } from './currencies/currencies.module';
import { AccreditationsModule } from './accreditations/accreditations.module';
import { RankingOrganizationsModule } from './ranking-organizations/ranking-organizations.module';
import { UniversityAccreditationsModule } from './university-accreditations/university-accreditations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    CacheModule.register({ isGlobal: true, ttl: 600000 }), // 10 minutes default TTL
    ThrottlerModule.forRoot([{
      ttl: 60000,   // 1 minute window
      limit: 100,   // 100 requests per minute
    }]),
    CommonModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    ProgramsModule,
    CountriesModule,
    CitiesModule,
    UniversitiesModule,
    AgencyServicesModule,
    DigitalOceanModule,
    FilesModule,
    ChatModule,
    CatalogModule,
    ApplicationsModule,
    MiniApplicationsModule,
    ValidityModule,
    StatisticsModule,
    NotificationsModule,
    IntakesModule,
    ScholarshipsModule,
    AdmissionRequirementsModule,
    CampusesModule,
    PartnerStudentsModule,
    PartnerApplicationsModule,
    StudentDocumentsModule,
    ApplicationProcessModule,
    ApplicationDocumentsModule,
    StudyLanguagesModule,
    ReviewsModule,
    PartnerOrganizationsModule,
    PartnerMembersModule,
    PartnerCompanyModule,
    PartnerAuditModule,
    SiteSettingsModule,
    AboutModule,
    CurrenciesModule,
    AccreditationsModule,
    RankingOrganizationsModule,
    UniversityAccreditationsModule,
    DbModule,
  ],

  providers: [DigitalOceanService],
  controllers: [],
})
export class AppModule {}
