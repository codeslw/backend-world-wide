import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiHeader, ApiResponse } from "@nestjs/swagger";
import { UniversityResponseDto } from "../dto/university-response.dto";
import { ErrorResponseDto } from "../../common/dto/error-response.dto";
import { HttpStatus } from "@nestjs/common";

export function ApiUniversityById() {
    return applyDecorators(
        ApiOperation({ summary: 'Get a single university by its ID' }),
        ApiParam({
            name: 'id',
            required: true,
            description: 'University ID (UUID format)',
            type: String,
        }),
        ApiHeader({
            name: 'Accept-Language',
            required: false,
            enum: ['uz', 'ru', 'en'],
            description: 'Language preference for localized fields (default: uz)',
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Successfully retrieved university details',
            type: UniversityResponseDto,
        }),
        ApiResponse({
            status: HttpStatus.NOT_FOUND,
            description: 'Not Found - University with the specified ID does not exist',
            type: ErrorResponseDto,
        }),
        ApiResponse({
            status: HttpStatus.BAD_REQUEST,
            description: 'Bad Request - Invalid ID format',
            type: ErrorResponseDto,
        }),
        ApiResponse({
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            description: 'Internal Server Error',
            type: ErrorResponseDto,
        }),
    )
}