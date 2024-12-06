import {
    Controller,
    Post,
    Get,
    Body,
    UseInterceptors,
    Res,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { TransactionService } from './transactions.service';
import { CreateTransactionDto } from './dto/createTransaction.dto';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@Controller('transaction')
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) { }

    @UseInterceptors(CacheInterceptor)
    @CacheTTL(30) // override TTL to 30 seconds
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

    @Get()
    async get() {
        return "Hello";
    }
}
