import { ApiProperty } from '@nestjs/swagger';

export class ValidityCheckResponseDto {
  @ApiProperty({
    description: 'Indicates whether the profile meets the requirements',
  })
  isValid: boolean;

  @ApiProperty({
    description:
      'An object containing details about any requirements that were not met',
    example: {
      degree:
        'Required degree: BACHELOR, but the user does not have it.',
      ielts: "Required IELTS score: 6.5, but the user's score is 6.",
    },
  })
  details: Record<string, string>;
}
