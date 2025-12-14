import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from "@nestjs/swagger";
import { ErrorResponseDto } from "src/common/dto/error-response.dto";
import { HttpStatus } from "@nestjs/common";

export function ApiDeleteUniversity() {

    return applyDecorators(
        ApiBearerAuth(),
        ApiOperation({ summary: 'Delete a university (Admin only)' }),
        ApiParam({
            name: 'id',
            required: true,
            description: 'University ID (UUID format)',
            type: String,
        }),
        ApiResponse({
            status: HttpStatus.NO_CONTENT,
            description: 'University successfully deleted',
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
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            description: 'Internal Server Error',
            type: ErrorResponseDto,
        })
    )

}