import { Module } from '@nestjs/common';
import { StudyLanguagesService } from './study-languages.service';
import { StudyLanguagesController } from './study-languages.controller';
import { DbModule } from '../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [StudyLanguagesController],
  providers: [StudyLanguagesService],
  exports: [StudyLanguagesService],
})
export class StudyLanguagesModule {}
