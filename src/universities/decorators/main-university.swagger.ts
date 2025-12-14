import { applyDecorators } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { MainUniversityResponseDto } from "../dto/main-university-response.dto";
import { ErrorResponseDto } from "../../common/dto/error-response.dto";
import { HttpStatus } from "@nestjs/common";


export function ApiMainUniversity() {
    return applyDecorators(
        ApiOperation({
            summary: 'Get main universities (maximum 3)',
        }),
        ApiHeader({
            name: 'Accept-Language',
            required: false,
            enum: ['uz', 'ru', 'en'],
            description: 'Language preference for localized fields (default: uz)',
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Successfully retrieved list of main universities',
            type: [MainUniversityResponseDto],
        }),
        ApiResponse({
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            description: 'Internal Server Error',
            type: ErrorResponseDto,
        })
    )
}