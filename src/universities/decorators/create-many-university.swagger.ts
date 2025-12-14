import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiBody, ApiResponse } from "@nestjs/swagger";
import { CreateManyUniversitiesDto } from "../dto/create-many-universities.dto";
import { ErrorResponseDto } from "../../common/dto/error-response.dto";
import { HttpStatus } from "@nestjs/common";
import { UniversityResponseDto } from "../dto/university-response.dto";

export function ApiCreateManyUniversity() {
    return applyDecorators(
        ApiBearerAuth(),
        ApiOperation({
            summary: 'Create multiple universities at once (Unauthorized)',
        }),
        ApiBody({
            type: CreateManyUniversitiesDto,
            description: 'Array of university data to create.',
        }),
        ApiResponse({
            status: HttpStatus.CREATED,
            description: 'Universities successfully created',
            type: [UniversityResponseDto],
        }),
        ApiResponse({
            status: HttpStatus.BAD_REQUEST,
            description: 'Bad Request - Invalid data provided in one or more entries',
            type: ErrorResponseDto,
        }),
        ApiResponse({
            status: HttpStatus.CONFLICT,
            description:
                'Conflict - Creation failed due to duplicate data in one or more entries',
            type: ErrorResponseDto,
        }),
        ApiResponse({
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            description: 'Internal Server Error',
            type: ErrorResponseDto,
        })
    )
}