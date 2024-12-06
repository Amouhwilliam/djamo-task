
import { Injectable, NestMiddleware, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { IdempotencyService } from './idempotency.service';

// This middleware ensure that the enpoint he is applied to, is idempotent for a certain time
@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  constructor(private readonly idempotencyService: IdempotencyService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try{
      const idempotencyKey = req.body.id as string //req.headers['idempotency-key'] as string;
      if (!idempotencyKey) {
        throw new BadRequestException('Idempotency key is missing');
      }

      const cachedResponse = await this.idempotencyService.getResponse(idempotencyKey);
      if (cachedResponse) {
        res.status(200).json(cachedResponse);
      } else {
        res.on('finish', async () => {
          if (res.statusCode < 400) {
            await this.idempotencyService.setResponse(idempotencyKey, res.locals.data);
          }
        });
        
        next();
      }
    } catch(error){
      throw new InternalServerErrorException(error.message);
    }
  }
}