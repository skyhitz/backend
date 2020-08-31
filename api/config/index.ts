// tslint:disable-next-line:no-var-requires
import { IConfig } from './config.interface';
import { config } from './dotenv.config';

config();

export const Config: IConfig = {
  ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID || '',
  REDIS_HOST: process.env.REDIS_HOST || '',
  REDIS_PORT: parseInt(process.env.REDIS_PORT) || 8080,
  REDIS_KEY: process.env.REDIS_KEY || '',
  ENV: process.env.ENV || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  HORIZON_URL: process.env.HORIZON_URL || '',
  ISSUER_SEED: process.env.ISSUER_SEED || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_PLAN_ID: process.env.STRIPE_PLAN_ID || '',
  API_ENDPOINT: process.env.API_ENDPOINT || '',
  ALGOLIA_ADMIN_API_KEY: process.env.ALGOLIA_ADMIN_API_KEY || '',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  UNIVERSAL_LINK_SCHEME: process.env.UNIVERSAL_LINK_SCHEME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  YOUTUBE_API_REFRESH_TOKEN: process.env.YOUTUBE_API_REFRESH_TOKEN || '',
  YOUTUBE_API_CLIENT_ID: process.env.YOUTUBE_API_CLIENT_ID || '',
  YOUTUBE_API_CLIENT_SECRET: process.env.YOUTUBE_API_CLIENT_SECRET || '',
};
