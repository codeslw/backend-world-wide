import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiOperation,
    ApiParam,
    ApiHeader,
    ApiResponse,
} from '@nestjs/swagger';
import { ProgramDetailsDto } from '../dto/university-by-program-response.dto';
import { ErrorResponseDto } from 'src/common/dto/error-response.dto';

export function ApiProgramsByUniversity() {
    return applyDecorators(
        ApiOperation({
            summary: 'Get programs by university ID',
        }),
        ApiParam({
            name: 'universityId',
            required: true,
            type: String,
            description: 'University ID',
        }),
        ApiHeader({
            name: 'Accept-Language',
            required: false,
            enum: ['uz', 'ru', 'en'],
            description: 'Language preference for localized fields (default: uz)',
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Successfully retrieved list of programs by university',
            type: [ProgramDetailsDto],
        }),
        ApiResponse({
            status: HttpStatus.BAD_REQUEST,
            description: 'Bad Request - Invalid query parameters',
            type: ErrorResponseDto,
        }),
        ApiResponse({
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            description: 'Internal Server Error',
            type: ErrorResponseDto,
        }),
    );
}
