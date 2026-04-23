import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaService } from './db/prisma.service';
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
import { ApplicationProcessModule } from './application-process/application-process.module';
import { StudyLanguagesModule } from './study-languages/study-languages.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    ApplicationProcessModule,
    StudyLanguagesModule,
  ],

  providers: [PrismaService, DigitalOceanService],
  controllers: [],
})
export class AppModule {}
