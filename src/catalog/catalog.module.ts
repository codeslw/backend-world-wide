import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CountriesModule } from '../countries/countries.module';
import { CitiesModule } from '../cities/cities.module';
import { ProgramsModule } from '../programs/programs.module';
import { StudyLanguagesModule } from '../study-languages/study-languages.module';

@Module({
  imports: [CountriesModule, CitiesModule, ProgramsModule, StudyLanguagesModule],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}

