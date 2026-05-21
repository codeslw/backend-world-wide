import { MiddlewareConsumer, Module, Global, NestModule } from '@nestjs/common';
import { FilterService } from './filters/filter.service';
import { AppLoggerService } from './logger/app-logger.service';
import { LogContextService } from './logger/log-context.service';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { RequestLoggingMiddleware } from './middleware/request-logging.middleware';

@Global()
@Module({
  providers: [
    FilterService,
    AppLoggerService,
    LogContextService,
    RequestContextMiddleware,
    RequestLoggingMiddleware,
  ],
  exports: [FilterService, AppLoggerService, LogContextService],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestContextMiddleware, RequestLoggingMiddleware)
      .forRoutes('*');
  }
}
