import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { TransactionService } from './transactions.service';
import { TrxInterface } from './dto/interfaces';

@Processor(process.env.PROCESS_TRX_QUEUE)
export class ProcessTrxConsumer extends WorkerHost {
    constructor(private readonly httpService: HttpService, private readonly transactionService: TransactionService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        //check first if the transaction is already processed im case of timeout
        if (job.attemptsStarted > 1) {
            this.httpService.axiosRef.get(`${process.env.THIRD_PARTY_URL}/transaction/${job.data.id}`, job.data)
                .then(async (res) => {
                    if (res.data && res.data.id) {
                        await this.transactionService.upsert(res.data)
                        await this.transactionService.notifyUser(res.data)
                    }
                }).catch(async () => {
                    console.log("transaction not found !")
                    // if the trx is not already processed in the thirdPartyApi, Re-do the request
                    try {
                        const data: TrxInterface = (await this.httpService.axiosRef.post(`${process.env.THIRD_PARTY_URL}/transaction`, job.data)).data
                        if (data && data.id) {
                            await this.transactionService.upsert(data)
                            await this.transactionService.notifyUser(data)
                        }
                    } catch (error) {
                        Logger.error(error)
                    }
                })
        } else {
            const data: TrxInterface = (await this.httpService.axiosRef.post(`${process.env.THIRD_PARTY_URL}/transaction`, job.data)).data
            if (data && data.id) {
                await this.transactionService.upsert(data)
                await this.transactionService.notifyUser(data)
            }
        }

    }
}

@Processor(process.env.UPDATE_TRX_QUEUE)
export class UpdateTrxConsumer extends WorkerHost {
    constructor(private readonly transactionService: TransactionService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        if (job.data) {
            await this.transactionService.upsert(job.data)
            await this.transactionService.notifyUser(job.data)
        }
    }
}
