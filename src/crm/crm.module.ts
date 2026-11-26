import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { CrmApplicantsService } from './crm-applicants.service';
import { CrmAuthService } from './crm-auth.service';
import { CrmController } from './crm.controller';

@Module({
  imports: [AuthModule, FilesModule],
  controllers: [CrmController],
  providers: [CrmAuthService, CrmApplicantsService],
})
export class CrmModule {}
