import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { UpdateUniversityDto } from '../dto/update-university.dto';
import { UniversityResponseDto } from '../dto/university-response.dto';

export function ApiUpdateUniversityPatch() {
    return applyDecorators(
        ApiBearerAuth(),
        ApiOperation({ summary: 'Update an existing university (Admin only)' }),
        ApiParam({
            name: 'id',
            required: true,
            description: 'University ID (UUID format)',
            type: String,
        }),
        ApiBody({
            type: UpdateUniversityDto,
            description:
                'Data to update for the university. Fields not provided will remain unchanged. Programs array replaces existing programs.',
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'University successfully updated',
            type: UniversityResponseDto,
        }),
        ApiResponse({
            status: HttpStatus.BAD_REQUEST,
            description:
                'Bad Request - Invalid data provided (e.g., invalid UUIDs, invalid program IDs)',
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
            status: HttpStatus.NOT_FOUND,
            description: 'Not Found - University with the specified ID does not exist',
            type: ErrorResponseDto,
        }),
        ApiResponse({
            status: HttpStatus.CONFLICT,
            description: 'Conflict - Update failed due to duplicate data',
            type: ErrorResponseDto,
        }),
        ApiResponse({
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            description: 'Internal Server Error',
            type: ErrorResponseDto,
        }),
    );
}