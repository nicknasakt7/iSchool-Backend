import { Injectable } from '@nestjs/common';
import StripeConstructor = require('stripe');
import { TypedConfigService } from 'src/config/typed-config.service';

export type StripeClient = StripeConstructor.Stripe;

@Injectable()
export class StripeService {
  readonly client: StripeClient;

  constructor(private readonly config: TypedConfigService) {
    this.client = new StripeConstructor(this.config.get('STRIPE_SECRET_KEY'));
  }

  get webhookSecret(): string {
    return this.config.get('STRIPE_WEBHOOK_SECRET');
  }
}
