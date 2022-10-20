// tslint:disable-next-line:no-var-requires
import { IConfig } from './config.interface';
import { config } from './dotenv.config';

config();

export const Config: IConfig = {
  ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID || '',
  APP_URL: process.env.APP_URL || '',
  ENV: process.env.ENV || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  HORIZON_URL: process.env.HORIZON_URL || '',
  ISSUER_SEED: process.env.ISSUER_SEED || '',
  TRANSACTION_FEE: process.env.TRANSACTION_FEE || '0.06',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_PLAN_ID: process.env.STRIPE_PLAN_ID || '',
  ALGOLIA_ADMIN_API_KEY: process.env.ALGOLIA_ADMIN_API_KEY || '',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  UNIVERSAL_LINK_SCHEME: process.env.UNIVERSAL_LINK_SCHEME || '',
  NFT_STORAGE_API_KEY: process.env.NFT_STORAGE_API_KEY || '',
  STELLAR_NETWORK: process.env.STELLAR_NETWORK || 'testnet',
  PINATA_JWT: process.env.PINATA_JWT || '',
};
