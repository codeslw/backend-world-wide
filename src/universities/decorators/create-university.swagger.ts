import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CreateUniversityDto } from "../dto/create-university.dto";
import { UniversityResponseDto } from "../dto/university-response.dto";
import { ErrorResponseDto } from "src/common/dto/error-response.dto";
import { HttpStatus } from "@nestjs/common";

export function ApiCreateUniversity() {
    return applyDecorators(
        ApiBearerAuth(),
        ApiOperation({ summary: 'Create a new university (Admin only)' }),
        ApiBody({
            type: CreateUniversityDto,
            description:
                'Data for creating a new university, including programs with tuition fees.',
        }),
        ApiResponse({
            status: HttpStatus.CREATED,
            description: 'University successfully created',
            type: UniversityResponseDto,
        }),
        ApiResponse({
            status: HttpStatus.BAD_REQUEST,
            description:
                'Bad Request - Invalid data provided (e.g., invalid UUIDs, missing fields, invalid program IDs)',
            type: ErrorResponseDto,
        }),
        ApiResponse({
            status: HttpStatus.UNAUTHORIZED,
            description: 'Unauthorized - Authentication required',
            type: ErrorResponseDto,
        }),
        ApiResponse({
            status: HttpStatus.FORBIDDEN,
            description: 'Forbidden - Insufficient permissions',
            type: ErrorResponseDto,
        }),
        ApiResponse({
            status: HttpStatus.CONFLICT,
            description: 'Conflict - University creation failed due to duplicate data',
            type: ErrorResponseDto,
        }),
        ApiResponse({
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            description: 'Internal Server Error',
            type: ErrorResponseDto,
        })
    )
}