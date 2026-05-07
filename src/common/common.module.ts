import { Module, Global } from '@nestjs/common';
import { FilterService } from './filters/filter.service';
import { AppLoggerService } from './logger/app-logger.service';

@Global()
@Module({
  providers: [FilterService, AppLoggerService],
  exports: [FilterService, AppLoggerService],
})
export class CommonModule {}
