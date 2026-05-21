import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestLogContext {
  requestId: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
}

@Injectable()
export class LogContextService {
  private readonly storage = new AsyncLocalStorage<RequestLogContext>();

  run<T>(context: RequestLogContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  get(): RequestLogContext | undefined {
    return this.storage.getStore();
  }

  update(context: Partial<RequestLogContext>): void {
    const store = this.storage.getStore();

    if (store) {
      Object.assign(store, context);
    }
  }
}
