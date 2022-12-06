// tslint:disable-next-line:no-var-requires
import { IConfig } from './config.interface';
import { config } from './dotenv.config';

config();

export const Config: IConfig = {
  ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID || '',
  APP_URL: process.env.APP_URL || '',
  ENV: process.env.ENV || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  HORIZON_URL: process.env.HORIZON_URL || '',
  ISSUER_SEED: process.env.ISSUER_SEED || '',
  TRANSACTION_FEE: process.env.TRANSACTION_FEE || '0.06',
  ALGOLIA_ADMIN_API_KEY: process.env.ALGOLIA_ADMIN_API_KEY || '',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  UNIVERSAL_LINK_SCHEME: process.env.UNIVERSAL_LINK_SCHEME || '',
  NFT_STORAGE_API_KEY: process.env.NFT_STORAGE_API_KEY || '',
  STELLAR_NETWORK: process.env.STELLAR_NETWORK || 'testnet',
  PINATA_JWT: process.env.PINATA_JWT || '',
  AUDIBLE_SECRET:
    Buffer.from(process.env.AUDIBLE_SECRET, 'base64').toString('ascii') || '',
  DEMO_ACCOUNT_UID: process.env.DEMO_ACCOUNT_UID || '',
  DEMO_ACCOUNT_TOKEN: process.env.DEMO_ACCOUNT_TOKEN || '',
};
