import { ApiProperty } from '@nestjs/swagger';

export class SiteSettingResponseDto {
  @ApiProperty({ example: 'World Wide' })
  appTitle: string;

  @ApiProperty({
    example: 'https://worldwideuz.blr1.digitaloceanspaces.com/uploads/logo.png',
    required: false,
    nullable: true,
  })
  logoUrl?: string | null;

  @ApiProperty({
    example: '2026-05-31T00:00:00.000Z',
  })
  updatedAt: Date;
}

