import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [
    {
      provide: PrismaService,
      useFactory: () => {
        const service = new PrismaService();
        service.$connect = jest.fn().mockResolvedValue(undefined);
        return service;
      },
    },
  ],
  exports: [PrismaService],
})
export class PrismaTestModule {}
