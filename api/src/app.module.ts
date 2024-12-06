import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import {redisStore} from 'cache-manager-redis-store';
import { ConfigModule } from '@nestjs/config';
import { TransactionModule } from './transactions/transactions.module';
import { BullModule } from '@nestjs/bullmq';
import { IdempotencyMiddleware } from './transactions/idempotency/idempotency.middleware';
import { IdempotencyService } from './transactions/idempotency/idempotency.service';
import { TransactionController } from './transactions/transactions.controller';

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
    BullModule.registerQueue(
      { name: process.env.PROCESS_TRX_QUEUE },
      { name: process.env.UPDATE_TRX_QUEUE }
    ),
    TransactionModule,
  ],
  controllers: [AppController],
  providers: [IdempotencyService]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(IdempotencyMiddleware)
      //.forRoutes({ path: 'transaction', method: RequestMethod.POST });
      .forRoutes(TransactionController);
  }
}
