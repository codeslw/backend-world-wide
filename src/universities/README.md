# Universities Module Documentation

## Overview

The Universities module provides REST API endpoints for managing university data within the Education Worldwide platform. It allows users to search, filter, and retrieve detailed information about educational institutions across the globe with localization support in multiple languages (Uzbek, Russian, and English).

## API Endpoints

### GET /universities

Retrieves a paginated list of universities with comprehensive filtering options.

#### Request Parameters

##### Headers
- `Accept-Language` (optional): Specifies the preferred language for localized content.
  - Values: `uz` (default), `ru`, `en`

##### Query Parameters

**Pagination**
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 10): Number of items per page (max: 50)
- `search` (optional): Search term to filter universities by name or description

**Filtering**
- `countryCode` (optional): Filter by country code
- `cityId` (optional): Filter by city ID
- `type` (optional): Filter by university type (PUBLIC/PRIVATE)
- `minRanking` (optional): Filter by minimum ranking position
- `maxRanking` (optional): Filter by maximum ranking position
- `minEstablished` (optional): Filter by minimum establishment year
- `maxEstablished` (optional): Filter by maximum establishment year
- `minAcceptanceRate` (optional): Filter by minimum acceptance rate percentage
- `maxAcceptanceRate` (optional): Filter by maximum acceptance rate percentage
- `minApplicationFee` (optional): Filter by minimum application fee
- `maxApplicationFee` (optional): Filter by maximum application fee
- `programs` (optional): Filter by program IDs (comma-separated UUIDs, e.g., `programs=uuid1,uuid2`)

**Sorting**
- `sortBy` (optional, default: 'ranking'): Field to sort results by
- `sortDirection` (optional, default: 'asc'): Sort direction (`asc` or `desc`)

#### Response Format

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "University Name",
      "established": 1950,
      "type": "PUBLIC",
      "avgApplicationFee": 100.00,
      "country": {
        "code": 1,
        "name": "Country Name"
      },
      "city": {
        "id": "uuid",
        "name": "City Name"
      },
      "description": "University description in the requested language",
      "winterIntakeDeadline": "2023-11-30T00:00:00.000Z",
      "autumnIntakeDeadline": "2023-06-30T00:00:00.000Z",
      "ranking": 150,
      "studentsCount": 25000,
      "acceptanceRate": 65.5,
      "website": "https://university.edu",
      "tuitionFeeMin": 5000.00,
      "tuitionFeeMax": 15000.00,
      "tuitionFeeCurrency": "USD",
      "photoUrl": "https://example.com/photo.jpg",
      "email": "contact@university.edu",
      "phone": "+1234567890",
      "address": "123 University Avenue",
      "programs": [
        {
          "id": "uuid",
          "name": "Program Name"
        }
      ]
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### GET /universities/:id

Retrieves detailed information about a specific university.

#### Request Parameters

##### Path Parameters
- `id`: The UUID of the university to retrieve

##### Headers
- `Accept-Language` (optional): Specifies the preferred language for localized content.
  - Values: `uz` (default), `ru`, `en`

#### Response Format

```json
{
  "id": "uuid",
  "name": "University Name",
  "established": 1950,
  "type": "PUBLIC",
  "avgApplicationFee": 100.00,
  "country": {
    "code": 1,
    "name": "Country Name"
  },
  "city": {
    "id": "uuid",
    "name": "City Name"
  },
  "description": "Detailed university description in the requested language",
  "winterIntakeDeadline": "2023-11-30T00:00:00.000Z",
  "autumnIntakeDeadline": "2023-06-30T00:00:00.000Z",
  "ranking": 150,
  "studentsCount": 25000,
  "acceptanceRate": 65.5,
  "website": "https://university.edu",
  "tuitionFeeMin": 5000.00,
  "tuitionFeeMax": 15000.00,
  "tuitionFeeCurrency": "USD",
  "photoUrl": "https://example.com/photo.jpg",
  "email": "contact@university.edu",
  "phone": "+1234567890",
  "address": "123 University Avenue",
  "programs": [
    {
      "id": "uuid",
      "name": "Program Name",
      "description": "Program description"
    }
  ]
}
```

### POST /universities (Admin only)

Creates a new university in the system.

#### Request Parameters

##### Headers
- `Authorization`: Bearer token with admin privileges
  
##### Request Body
```json
{
  "nameUz": "Университет название на узбекском",
  "nameRu": "Университет название на русском",
  "nameEn": "University name in English",
  "established": 1950,
  "type": "PUBLIC",
  "avgApplicationFee": 100.00,
  "countryCode": 1,
  "cityId": "uuid",
  "descriptionUz": "Описание на узбекском",
  "descriptionRu": "Описание на русском",
  "descriptionEn": "Description in English",
  "winterIntakeDeadline": "2023-11-30T00:00:00.000Z",
  "autumnIntakeDeadline": "2023-06-30T00:00:00.000Z",
  "ranking": 150,
  "studentsCount": 25000,
  "acceptanceRate": 65.5,
  "website": "https://university.edu",
  "tuitionFeeMin": 5000.00,
  "tuitionFeeMax": 15000.00,
  "tuitionFeeCurrency": "USD",
  "photoUrl": "https://example.com/photo.jpg",
  "email": "contact@university.edu",
  "phone": "+1234567890",
  "address": "123 University Avenue",
  "programs": ["program-uuid-1", "program-uuid-2"]
}
```

### PATCH /universities/:id (Admin only)

Updates an existing university.

#### Request Parameters

##### Path Parameters
- `id`: The UUID of the university to update

##### Headers
- `Authorization`: Bearer token with admin privileges
  
##### Request Body
Partial update with any of the fields from the create operation.

### DELETE /universities/:id (Admin only)

Deletes a university from the system.

#### Request Parameters

##### Path Parameters
- `id`: The UUID of the university to delete

##### Headers
- `Authorization`: Bearer token with admin privileges

## Data Validation

The Universities module implements comprehensive validation for all input data:

- All text fields have appropriate length constraints
- Numeric fields have min/max value validations
- Dates are validated for proper formatting
- Enum fields are restricted to predefined values
- References to related entities (country, city, programs) are verified

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Successful operation
- `201 Created`: Resource successfully created
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `500 Internal Server Error`: Server-side error

Error responses follow a standardized format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": {
    "field": ["error message"]
  }
}
```

## Localization

The API supports content localization in three languages:
- Uzbek (`uz`) - Default
- Russian (`ru`)
- English (`en`)

Localization is controlled through the `Accept-Language` header and applies to:
- University names
- University descriptions
- Country names
- City names
- Program names and descriptions 