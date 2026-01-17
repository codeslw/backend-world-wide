import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiHeader, ApiResponse } from "@nestjs/swagger";
import { UniversityType } from "../../common/enum/university-type.enum";
import { Currency } from "../../common/enum/currency.enum";
import { StudyLevel } from "../../common/enum/study-level.enum";
import { HttpStatus } from "@nestjs/common";
import { ErrorResponseDto } from "../../common/dto/error-response.dto";
import { PaginatedUniversityListItemResponseDto } from "../dto/university-list-item.dto";

export function ApiUniversities() {
    return applyDecorators(
        ApiOperation({
            summary: 'Get all universities with pagination, filtering, and search',
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
            description: 'Search term for name, description, website',
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
            name: 'type',
            required: false,
            enum: UniversityType,
            description: 'Filter by university type',
        }),
        ApiQuery({
            name: 'minRanking',
            required: false,
            type: Number,
            description: 'Filter by minimum ranking',
        }),
        ApiQuery({
            name: 'maxRanking',
            required: false,
            type: Number,
            description: 'Filter by maximum ranking',
        }),
        ApiQuery({
            name: 'minEstablished',
            required: false,
            type: Number,
            description: 'Filter by minimum establishment year',
        }),
        ApiQuery({
            name: 'maxEstablished',
            required: false,
            type: Number,
            description: 'Filter by maximum establishment year',
        }),
        ApiQuery({
            name: 'minAcceptanceRate',
            required: false,
            type: Number,
            description: 'Filter by minimum acceptance rate (%)',
        }),
        ApiQuery({
            name: 'maxAcceptanceRate',
            required: false,
            type: Number,
            description: 'Filter by maximum acceptance rate (%)',
        }),
        ApiQuery({
            name: 'minApplicationFee',
            required: false,
            type: Number,
            description: 'Filter by minimum average application fee',
        }),
        ApiQuery({
            name: 'maxApplicationFee',
            required: false,
            type: Number,
            description: 'Filter by maximum average application fee',
        }),
        ApiQuery({
            name: 'applicationFeeCurrency',
            required: false,
            enum: Currency,
            description: 'Filter by application fee currency',
        }),
        ApiQuery({
            name: 'minTuitionFee',
            required: false,
            type: Number,
            description: 'Filter by minimum tuition fee across programs',
        }),
        ApiQuery({
            name: 'maxTuitionFee',
            required: false,
            type: Number,
            description: 'Filter by maximum tuition fee across programs',
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
            name: 'programs',
            required: false,
            type: String,
            description: 'Filter by program IDs (comma-separated UUIDs string)',
            style: 'form',
            explode: false,
        }),
        ApiQuery({
            name: 'sortBy',
            required: false,
            type: String,
            description: 'Field to sort by (e.g., ranking, nameUz, createdAt)',
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
            description: 'Successfully retrieved list of universities',
            type: PaginatedUniversityListItemResponseDto,
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