import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CreateTransactionDto } from './dto/createTransaction.dto';

@Injectable()
export class TransactionService {
  constructor( @Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async create(data: CreateTransactionDto){
    //const value: string = await this.cacheManager.get('greetings');
      return {id: data.id, status: "success"}
  }
}
