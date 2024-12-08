import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { PrismaModule } from './utils/prisma/prisma.module';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import {redisStore} from 'cache-manager-redis-store';
import { ConfigModule } from '@nestjs/config';
import { TransactionModule } from './transactions/transactions.module';
import { BullModule } from '@nestjs/bullmq';
import { IdempotencyMiddleware } from './utils/idempotency/idempotency.middleware';
import { IdempotencyService } from './utils/idempotency/idempotency.service';
import { TransactionController } from './transactions/transactions.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { ClockWorkService } from './utils/scheduler/clockWork.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const store = await redisStore({
          socket: {
            host: process.env.REDIS_HOST,
            port: 6379
          }
        });

        return {
          store: store as unknown as CacheStore,
          ttl: 5 * 60000, // 5 minutes (milliseconds)
        };
      },
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: 6379,
      }
    }),
    TransactionModule,
    ScheduleModule.forRoot()
  ],
  controllers: [],
  providers: [IdempotencyService, ClockWorkService]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(IdempotencyMiddleware)
      .exclude(
        { path: 'transaction/webhook', method: RequestMethod.POST }
      )
      .forRoutes(TransactionController);
  }
}
