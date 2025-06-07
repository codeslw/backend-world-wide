import { Module, Global } from '@nestjs/common';
import { FilterService } from './filters/filter.service';

@Global()
@Module({
  providers: [FilterService],
  exports: [FilterService],
})
export class CommonModule {}
