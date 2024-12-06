import { Module } from '@nestjs/common';
import { TransactionService } from './transactions.service';
import { TransactionController } from './transactions.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
@Module({
  imports:  [PrismaModule],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}