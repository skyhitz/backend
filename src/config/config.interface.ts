export interface IConfig {
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
  API_ENDPOINT: string;
  ALGOLIA_APP_ID: string;
  ALGOLIA_ADMIN_API_KEY: string;
  SENDGRID_API_KEY: string;
  UNIVERSAL_LINK_SCHEME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  YOUTUBE_API_REFRESH_TOKEN: string;
  YOUTUBE_API_CLIENT_ID: string;
  YOUTUBE_API_CLIENT_SECRET: string;
}
