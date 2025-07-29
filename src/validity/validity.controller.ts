import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ValidityService } from './validity.service';
import { ValidityCheckResponseDto } from './dto/validity-check-response.dto';

@ApiTags('validity')
@Controller('validity')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ValidityController {
  constructor(private readonly validityService: ValidityService) {}

  @Get('check/:universityId')
  @ApiOperation({
    summary: 'Check if a user profile meets university requirements',
  })
  @ApiResponse({
    status: 200,
    description: 'The result of the validity check',
    type: ValidityCheckResponseDto,
  })
  async check(
    @Request() req,
    @Param('universityId', ParseUUIDPipe) universityId: string,
  ): Promise<ValidityCheckResponseDto> {
    return this.validityService.check(req.user.userId, universityId);
  }
}
