import { Injectable } from '@nestjs/common';

import { TypedConfigService } from 'src/config/typed-config.service';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private readonly typedConfigService: TypedConfigService) {
    const adapter = new PrismaPg({
      connectionString: typedConfigService.get('DATABASE_URL'),
    });
    super({ adapter });
  }
}
