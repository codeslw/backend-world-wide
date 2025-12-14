import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiHeader, ApiResponse } from "@nestjs/swagger";
import { Currency } from "../../common/enum/currency.enum";
import { StudyLevel } from "../../common/enum/study-level.enum";
import { PaginatedUniversityByProgramResponseDto } from "../dto/university-by-program-response.dto";
import { ErrorResponseDto } from "../../common/dto/error-response.dto";
import { HttpStatus } from "@nestjs/common";

export function ApiUniversitiesByPrograms() {
    return applyDecorators(
        ApiOperation({
            summary:
                'Get universities expanded by programs - each program becomes a separate entry',
        }),
        ApiQuery({
            name: 'page',
            required: false,
            type: Number,
            description: 'Page number for pagination (default: 1)',
        }),
        ApiQuery({
            name: 'limit',
            required: false,
            type: Number,
            description: 'Number of items per page (default: 10)',
        }),
        ApiQuery({
            name: 'search',
            required: false,
            type: String,
            description: 'Search term for university name, description, or program title',
        }),
        ApiQuery({
            name: 'countryCode',
            required: false,
            type: Number,
            description: 'Filter by country code (integer ID)',
        }),
        ApiQuery({
            name: 'cityId',
            required: false,
            type: String,
            description: 'Filter by city ID (UUID)',
        }),
        ApiQuery({
            name: 'minTuitionFee',
            required: false,
            type: Number,
            description: 'Filter by minimum tuition fee',
        }),
        ApiQuery({
            name: 'maxTuitionFee',
            required: false,
            type: Number,
            description: 'Filter by maximum tuition fee',
        }),
        ApiQuery({
            name: 'tuitionFeeCurrency',
            required: false,
            enum: Currency,
            description: 'Filter by tuition fee currency',
        }),
        ApiQuery({
            name: 'studyLevel',
            required: false,
            enum: StudyLevel,
            description: 'Filter by study level',
        }),
        ApiQuery({
            name: 'minRanking',
            required: false,
            type: Number,
            description: 'Filter by minimum university ranking',
        }),
        ApiQuery({
            name: 'maxRanking',
            required: false,
            type: Number,
            description: 'Filter by maximum university ranking',
        }),
        ApiQuery({
            name: 'sortBy',
            required: false,
            type: String,
            description:
                'Field to sort by (ranking, tuitionFee, universityName, established)',
        }),
        ApiQuery({
            name: 'sortDirection',
            required: false,
            enum: ['asc', 'desc'],
            description: 'Sort direction (asc or desc)',
        }),
        ApiHeader({
            name: 'Accept-Language',
            required: false,
            enum: ['uz', 'ru', 'en'],
            description: 'Language preference for localized fields (default: uz)',
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description:
                'Successfully retrieved list of universities expanded by programs',
            type: PaginatedUniversityByProgramResponseDto,
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
    )
}