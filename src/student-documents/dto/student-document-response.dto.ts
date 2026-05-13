import { ApiProperty } from '@nestjs/swagger';

export class StudentDocumentResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() studentId: string;
  @ApiProperty() type: string;
  @ApiProperty() name: string;
  @ApiProperty() url: string;
  @ApiProperty() createdAt: Date;
}
