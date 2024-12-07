import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { TransactionService } from './transactions.service';
import { TrxInterface } from './dto/interfaces';

@Processor(process.env.PROCESS_TRX_QUEUE)
export class ProcessTrxConsumer extends WorkerHost {
    constructor(private readonly httpService: HttpService, private readonly transactionService: TransactionService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        Logger.log(`-- START PROCCESS_TRX JOB ${job.data.id} --`, job.data)
        const { data } = await firstValueFrom(
            this.httpService.post<TrxInterface>(`${process.env.THIRD_PARTY_URL}/transaction`, job.data).pipe(
              catchError((error: AxiosError) => {
                Logger.error(error.response.data);
                throw new Error(error.message);
              }),
            ),
          );
        await this.transactionService.upsert(data)
        await this.transactionService.notifyUser(data)
    }
}

@Processor(process.env.UPDATE_TRX_QUEUE)
export class UpdateTrxConsumer extends WorkerHost {
    constructor(private readonly transactionService: TransactionService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        Logger.log(`-- START UPDATE TRX JOB ${job.data.id} --`)
        await this.transactionService.upsert(job.data)
        await this.transactionService.notifyUser(job.data)
    }
}
