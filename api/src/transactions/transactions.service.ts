import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CreateTransactionDto } from './dto/createTransaction.dto';
import { PrismaService } from 'src/utils/prisma/prisma.service';
import { STATUS } from './dto/constant';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { UpdateTransactionDto } from './dto/updateTransaction.dto';
import { HttpService } from '@nestjs/axios';
import { Transaction } from './dto/interfaces';
import { loadJobConfig } from 'src/utils/helper';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class TransactionService {
  private readonly TTL = 50

  constructor(
    @InjectQueue(process.env.PROCESS_TRX_QUEUE) private readonly processTrxQueue: Queue,
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly httpService: HttpService,
  ) { }

  /**
   *  Take the transactionID, check in the cache or the db and  
   *  retrun the transaction saved
   *  the DB will always have the most updated version of the transactionss
   * 
   * @param data CreateTransactionDto
   * @returns 
   */
  async create(data: CreateTransactionDto) {

    const transactionID = data.id
    const res: Transaction = JSON.parse(await this.cacheManager.get(`trx-${transactionID}`));
    if (res) {
      return {...res, id: res.transactionID}
    }

    const trx = await this.prisma.transaction.findUnique({
      where: { transactionID }
    })

    if (trx) {
      //Check if the trx is pending but not in the queue, if so push it to the Queue
      if (trx.status == STATUS.pending) {
        await this.processIgnoredTrx(trx)
      }
      return {...trx, id: trx.transactionID}

    } else {
      const newTransaction: Transaction = await this.prisma.transaction.create({
        data: {
          transactionID,
          status: STATUS.pending
        }
      });

      // Push into queue
      this.processTrxQueue.add(
        'process-trx',
        {
          id: transactionID,
          webhookUrl: `${process.env.BASE_URL}/transaction/webhook`
        },
        loadJobConfig(transactionID)
      )
        .then(async () => {
          await this.cacheManager
            .set(`trx-${newTransaction.transactionID}`,
              JSON.stringify(newTransaction),
              { ttl: this.TTL } as any
            );
        })

      return {
        id: newTransaction.transactionID,
        status: newTransaction.status
      }
    }
  }

  async upsert(trx: UpdateTransactionDto) {

    // upsert insted of update because if by any chance this trx was not in the db it will get create
    const upsertTrx = await this.prisma.transaction.upsert({
      where: {
        transactionID: trx.id,
      },
      update: {
        status: trx.status,
      },
      create: {
        transactionID: trx.id,
        status: trx.status
      },
    })

    await this.cacheManager.set(`trx-${upsertTrx.transactionID}`, JSON.stringify(upsertTrx), { ttl: this.TTL } as any);
  }

  async notifyUser(trx: UpdateTransactionDto) {
    await this.httpService.axiosRef.put(`${process.env.CLIENT_URL}/transaction`, trx)
  }

  /*
  ** This function check if there is a pending trx in the db but not in the queue
  ** and enqueue it
  */
  async processIgnoredTrx(trx: Transaction) {
    const job = this.processTrxQueue.getJob(trx.transactionID)
    if (!job) {
      await this.processTrxQueue.add(
        'process-trx',
        {
          id: trx.transactionID,
          webhookUrl: `${process.env.BASE_URL}/transaction/webhook`
        },
        loadJobConfig(trx.transactionID)
      )
    }
  }

  /*
  ** Check if the trx is already processed
  */
  async checkExistProcessedTrx(id: string) {
    const exists = await this.prisma.transaction.findFirst({
      where: {
        transactionID: id,
        AND: {
          status: { in: [STATUS.completed, STATUS.declined] },
        },
      }
    })
    return exists ? true : false;
  }

  /*
  ** Check every 2 min if there is some pending unprocessed transaction 
  ** and enqueue them 
  ** this task can be resource consuming 
  */
  @Interval(2 * 1 * 1000)
  async enqueueIgnoredTrx() {
    try{
      const transactions = await this.prisma.transaction.findMany({
        where: { status: STATUS.pending },
      });
      if(transactions && transactions.length > 0){
        transactions.map(async (trx: Transaction)=>{
          await this.processIgnoredTrx(trx)
        })
      }
    }catch(e){
      Logger.error(e)
    }
  }

}
