import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CreateTransactionDto } from './dto/createTransaction.dto';
import { PrismaService } from 'src/utils/prisma/prisma.service';
import { STATUS } from './dto/constant';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { log } from 'console';
import { UpdateTransactionDto } from './dto/updateTransaction.dto';
import { HttpService } from '@nestjs/axios';
import { TrxInterface } from './dto/interfaces';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { loadJobConfig } from 'src/utils/helper';

@Injectable()
export class TransactionService {
  private readonly TTL = 60

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

    // implementation Tracing
    Logger.log(`-- START TRANSACTION ${transactionID} --`)

    const res: string = await this.cacheManager.get(`trx-${transactionID}`);
    if (res) {
      Logger.log(`-- RETURN CACHED TRANSACTION ${transactionID} --`)
      return JSON.parse(res)
    }

    const trx = await this.prisma.transaction.findUnique({
      where: { transactionID }
    })

    Logger.log(`-- TRANSACTION RETRIEVED IN DB ${transactionID} --`, trx)

    if (trx) {
      //Check if the trx is pending but not in the queue, if so push it to the Queue
      if (trx.status == STATUS.pending) {
        await this.getIgnoredTrx(trx)
      }
      return trx

    } else {
      const newTransaction = await this.prisma.transaction.create({
        data: {
          transactionID,
          status: STATUS.pending
        }
      });

      Logger.log(`-- CREATE TRX IN DB ${transactionID} --`, newTransaction)

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

          Logger.log(`-- NEW TRX PUSHED TO QUEUE AND CACHED ${transactionID} --`)
        })

      return {
        id: newTransaction.transactionID,
        status: newTransaction.status
      }
    }
  }

  async upsert(trx: UpdateTransactionDto) {
    Logger.log(`-- START UPDATING OLD TRX WITH NEW DATA FROM QUEUE ${trx.id} --`)

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

    Logger.log(`-- UPDATE TRX IN DB ${upsertTrx.transactionID} --`, upsertTrx)
    await this.cacheManager.set(`trx-${upsertTrx.transactionID}`, JSON.stringify(upsertTrx), { ttl: this.TTL } as any);

    Logger.log(`-- SET UPDATED TRX IN CACHE ${upsertTrx.transactionID} --`, upsertTrx)
  }

  async notifyUser(trx: UpdateTransactionDto) {
    Logger.log(`-- START SENDING NOTIFICATION TO CLIENT ${trx.id} --`, trx)
    /*await firstValueFrom(
      this.httpService.put<TrxInterface>(`${process.env.CLIENT_URL}/transaction`, trx).pipe(
        catchError((error: AxiosError) => {
          Logger.error(error.response.data);
          throw new Error(error.message);
        }),
      )
    )*/
    await this.httpService.axiosRef.put(`${process.env.CLIENT_URL}/transaction`, trx)
    Logger.log("Notification sent successfully", trx.id)
  }

  /*
  ** This function check if there is a pending trx in the db but not in the queue
  ** and enqueue it
  */
  async getIgnoredTrx(trx: { id: number, transactionID: string, status: string }) {
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
      Logger.log(`-- INSERT EXISTING PENDING TRX IN QUEUE ${trx.transactionID} --`)
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
          status: { in: [STATUS.success, STATUS.failure] },
        },
      }
    })
    return exists ? true : false;
  }

}
