import {
    Controller,
    Post,
    Body,
    Res,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { TransactionService } from './transactions.service';
import { CreateTransactionDto } from './dto/createTransaction.dto';
import { UpdateTransactionDto } from './dto/updateTransaction.dto';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { loadJobConfig } from 'src/utils/helper';

@Controller('transaction')
export class TransactionController {
    constructor(
        private readonly transactionService: TransactionService,
        @InjectQueue(process.env.UPDATE_TRX_QUEUE) private readonly updateTrxQueue: Queue,
    ) { }


    @Post()
    async create(@Body() createTransactionDto: CreateTransactionDto, @Res() res: Response) {
        try {
            const data = await this.transactionService.create(createTransactionDto);
            res.locals.data = data;
            res.status(200).json(data);
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    
    @Post('/webhook')
    async webhook(@Body() updateTransactionDto: UpdateTransactionDto) {
        try {
            if(!this.transactionService.checkExistProcessedTrx(updateTransactionDto.id)){
                await this.updateTrxQueue.add('update-trx', updateTransactionDto, loadJobConfig(updateTransactionDto.id)) 
                Logger.log(`-- PUSH TO UPDATE TRX JOB ${updateTransactionDto.id} --`)    
            }
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }
}

