import { Controller, Get, Headers } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AboutService } from './about.service';

type Lang = 'uz' | 'ru' | 'en';

@ApiTags('About - Aggregate')
@Controller('about')
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Get()
  @ApiOperation({
    summary:
      'Get the full localized About page payload in one request (public)',
  })
  @ApiHeader({
    name: 'Accept-Language',
    enum: ['uz', 'ru', 'en'],
    required: false,
  })
  @ApiResponse({ status: 200 })
  getAbout(@Headers('Accept-Language') lang: string = 'uz') {
    const effective: Lang = (['uz', 'ru', 'en'].includes(lang) ? lang : 'uz') as Lang;
    return this.aboutService.getAggregate(effective);
  }
}
