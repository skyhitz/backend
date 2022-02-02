export interface IConfig {
  APP_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_KEY: string;
  ENV: string;
  JWT_SECRET: string;
  STRIPE_WEBHOOK_SECRET: string;
  HORIZON_URL: string;
  ISSUER_SEED: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_PLAN_ID: string;
  ALGOLIA_APP_ID: string;
  ALGOLIA_ADMIN_API_KEY: string;
  SENDGRID_API_KEY: string;
  UNIVERSAL_LINK_SCHEME: string;
  NFT_STORAGE_API_KEY: string;
}
