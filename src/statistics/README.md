# Statistics Module

## Overview

The Statistics Module provides comprehensive analytics and reporting capabilities for the EduWorldWide platform. It aggregates data across all modules to deliver insights for administrators.

## Features

### Core Analytics
- **Dashboard Overview**: Complete statistics summary for admin dashboards
- **Entity Counts**: Total counts across universities, programs, applications, profiles, etc.
- **Application Analytics**: Status breakdowns, trends, and detailed analysis
- **Geographic Distribution**: Student and university distribution by country/region
- **Program Popularity**: Most applied-to programs with demand metrics
- **University Rankings**: Top universities by application volume
- **Growth Metrics**: Monthly growth trends for business intelligence
- **User Engagement**: Conversion rates and user behavior analytics

### Technical Features
- **Prisma Aggregation**: Efficient database queries using Prisma's `groupBy` and aggregate functions
- **Date Filtering**: Flexible time period filtering (7 days to all-time)
- **Pagination Support**: Configurable result limits for large datasets
- **Role-based Security**: Admin-only access with JWT authentication
- **Comprehensive Swagger Documentation**: Complete API documentation for frontend integration
- **Error Handling**: Standardized error responses following project conventions

## Architecture

```
statistics/
├── dto/
│   ├── statistics-response.dto.ts    # Response type definitions
│   └── statistics-query.dto.ts       # Query parameter validation
├── statistics.controller.ts          # HTTP endpoints with Swagger docs
├── statistics.service.ts             # Business logic and database operations
├── statistics.module.ts              # NestJS module configuration
├── FRONTEND_API_DOCUMENTATION.md     # Frontend developer guide
└── README.md                         # This file
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/statistics/dashboard` | GET | Complete dashboard overview |
| `/statistics/totals` | GET | Entity count summaries |
| `/statistics/applications/status` | GET | Application status breakdown |
| `/statistics/applications/detailed` | GET | Comprehensive application analytics |
| `/statistics/applications/trends` | GET | Daily application trends |
| `/statistics/geographic` | GET | Geographic distribution data |
| `/statistics/programs/popular` | GET | Most popular programs |
| `/statistics/universities/top` | GET | Top universities by applications |
| `/statistics/growth` | GET | Monthly growth statistics |
| `/statistics/engagement` | GET | User engagement metrics |

## Quick Start

### 1. Import the Module
The module is already imported in `app.module.ts`:

```typescript
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    // ... other modules
    StatisticsModule,
  ],
})
export class AppModule {}
```

### 2. Basic Usage (Frontend)

```javascript
// Get dashboard data
const response = await fetch('/api/v1/statistics/dashboard', {
  headers: {
    'Authorization': 'Bearer ' + adminToken,
    'Content-Type': 'application/json'
  }
});
const dashboardData = await response.json();

// Get application trends
const trends = await fetch('/api/v1/statistics/applications/trends?days=30', {
  headers: { 'Authorization': 'Bearer ' + adminToken }
});
const trendData = await trends.json();
```

### 3. Query Parameters

Most endpoints support filtering:

```typescript
// Date filtering
GET /statistics/dashboard?period=last_30_days
GET /statistics/dashboard?startDate=2024-01-01&endDate=2024-12-31

// Result limiting
GET /statistics/geographic?limit=5
GET /statistics/programs/popular?limit=10

// Trend analysis
GET /statistics/applications/trends?days=90
```

## Database Performance

The module uses optimized Prisma queries:

- **Parallel Execution**: Multiple queries run concurrently using `Promise.all()`
- **Efficient Aggregation**: Uses Prisma's `groupBy`, `count`, and `aggregate` functions
- **Selective Fields**: Only fetches required fields to minimize data transfer
- **Raw SQL**: Complex analytical queries use raw SQL for maximum performance

## Security

- **Admin Only**: All endpoints require `ADMIN` role
- **JWT Authentication**: Standard bearer token authentication
- **Role Guards**: Enforced at controller level using `@Roles(Role.ADMIN)`
- **Input Validation**: All query parameters validated using class-validator

## Frontend Integration

Comprehensive frontend documentation is available in `FRONTEND_API_DOCUMENTATION.md`, including:

- Complete API reference with examples
- React component examples
- Chart.js integration samples
- Error handling patterns
- Performance optimization strategies
- Caching implementations

## Future Enhancements

The module is designed for extensibility. Planned features include:

- **Financial Analytics**: Revenue and fee analysis
- **Acceptance Rate Analysis**: University and program acceptance ratios
- **Processing Time Metrics**: Application processing speed analytics
- **Predictive Analytics**: Machine learning-based forecasting
- **Real-time Metrics**: WebSocket-based live updates
- **Data Export**: CSV/Excel export functionality
- **Automated Reports**: Scheduled report generation

## Dependencies

- `@nestjs/common`: Core NestJS functionality
- `@nestjs/swagger`: API documentation
- `@prisma/client`: Database operations
- `class-validator`: Input validation
- `class-transformer`: Data transformation

## Testing

```bash
# Unit tests
npm run test statistics

# Integration tests
npm run test:e2e statistics

# Test coverage
npm run test:cov
```

## Performance Considerations

- **Caching**: Implement Redis caching for frequently accessed data
- **Indexes**: Ensure proper database indexes on date and foreign key fields
- **Pagination**: Use pagination for large result sets
- **Rate Limiting**: Consider rate limiting for resource-intensive endpoints

## Contributing

When adding new statistics endpoints:

1. Follow the established DTO patterns
2. Add comprehensive Swagger documentation
3. Include example requests/responses in the frontend documentation
4. Use Prisma aggregation functions for performance
5. Add proper error handling and validation
6. Update this README with new endpoints

## Support

For questions or issues related to the Statistics Module, please refer to:

- API Documentation: `FRONTEND_API_DOCUMENTATION.md`
- Swagger UI: `/api` (when running the application)
- Project documentation in the main README