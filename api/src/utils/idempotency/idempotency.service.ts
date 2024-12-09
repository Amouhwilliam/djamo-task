import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

interface CachedValue {
    id: string
    value: string
}

// This service cached the idempotency key for 5s
@Injectable()
export class IdempotencyService {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

    async getResponse(key: string): Promise<Response>{
        const res: string = await this.cacheManager.get(`idempotency-key-${key}`); 
        return JSON.parse(res)
    }

    async setResponse(key: string, response: CachedValue): Promise<void> {
        await this.cacheManager.set(`idempotency-key-${key}`, JSON.stringify(response),  {ttl: 5} as any);
    }
}