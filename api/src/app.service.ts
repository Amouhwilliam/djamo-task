import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class AppService {
  constructor( @Inject(CACHE_MANAGER) private cacheManager: Cache) {}


  async getHello(): Promise<string> {
    const value: string = await this.cacheManager.get('greetings');
    return value
  }

  async setHello() {
    await this.cacheManager.set('greetings', 'Hello William');
  }
}
