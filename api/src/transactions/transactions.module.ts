import { Module } from '@nestjs/common';
import { TransactionService } from './transactions.service';
import { TransactionController } from './transactions.controller';
import { PrismaModule } from 'src/utils/prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { ProcessTrxConsumer, UpdateTrxConsumer } from './transaction.consumers';
@Module({
  imports:  [
    PrismaModule,
    HttpModule.registerAsync({
      useFactory: () => ({
        //will timeout the request to the third party after 10s waiting 
        //and reprocess the job (offering 90% of chnace of no timeout case)
        timeout: 15000,
        maxRedirects: 3,
      }),
    }),
    BullModule.registerQueue(
      { name: process.env.PROCESS_TRX_QUEUE },
      { name: process.env.UPDATE_TRX_QUEUE }
    ),
  ],
  controllers: [TransactionController],
  providers: [TransactionService, ProcessTrxConsumer, UpdateTrxConsumer],
})
export class TransactionModule {}