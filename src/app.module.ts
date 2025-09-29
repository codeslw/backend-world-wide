import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { FilesModule } from './files/files.module';
import { ChatModule } from './chat/chat.module';
import { CatalogModule } from './catalog/catalog.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ApplicationsModule } from './applications/applications.module';
import { MiniApplicationsModule } from './modules/mini-applications.module';
import { ValidityModule } from './validity/validity.module';
import { StatisticsModule } from './statistics/statistics.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    ProgramsModule,
    CountriesModule,
    CitiesModule,
    UniversitiesModule,
    DigitalOceanModule,
    FilesModule,
    ChatModule,
    CatalogModule,
    ApplicationsModule,
    MiniApplicationsModule,
    ValidityModule,
    StatisticsModule,
    NotificationsModule,
  ],
  providers: [PrismaService, DigitalOceanService],
  controllers: [],
})
export class AppModule {}
