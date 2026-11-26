import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ServiceActorGuard } from '../auth/guards/service-actor.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { CrmApplicantsService } from './crm-applicants.service';
import { CrmAuthService } from './crm-auth.service';
import { CrmServiceGuard } from './crm-service.guard';
import {
  CrmChangePasswordDto,
  CrmForgotPasswordDto,
  CrmResetPasswordDto,
  CrmVerifyDto,
} from './dto/crm-auth.dto';
import { UpdateCrmApplicantDto } from './dto/crm-applicant.dto';

/** Which kind of applicant: a partner's student or a client account. */
export enum ApplicantKind {
  partner = 'partner',
  client = 'client',
}

/** What edu-crm's backend calls (docs/student-events.md). Not a public API. */
@ApiExcludeController()
@Controller('crm')
export class CrmController {
  constructor(
    private readonly auth: CrmAuthService,
    private readonly applicants: CrmApplicantsService,
  ) {}

  @Post('auth/verify')
  @UseGuards(CrmServiceGuard)
  @HttpCode(HttpStatus.OK)
  verify(@Body() dto: CrmVerifyDto) {
    return this.auth.verify(dto);
  }

  @Post('auth/change-password')
  @UseGuards(CrmServiceGuard)
  @HttpCode(HttpStatus.OK)
  changePassword(@Body() dto: CrmChangePasswordDto) {
    return this.auth.changePassword(dto);
  }

  @Post('auth/forgot-password')
  @UseGuards(CrmServiceGuard)
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: CrmForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('auth/reset-password')
  @UseGuards(CrmServiceGuard)
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: CrmResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  /** The whole profile, including what is not sent over events (passport number, address). */
  @Get('applicants/:kind/:id')
  @UseGuards(ServiceActorGuard, JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  applicant(
    @Param('kind', new ParseEnumPipe(ApplicantKind)) kind: ApplicantKind,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applicants.get(kind, id);
  }

  @Patch('applicants/:kind/:id')
  @UseGuards(ServiceActorGuard, JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateApplicant(
    @Param('kind', new ParseEnumPipe(ApplicantKind)) kind: ApplicantKind,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCrmApplicantDto,
  ) {
    return this.applicants.update(kind, id, dto);
  }
}
