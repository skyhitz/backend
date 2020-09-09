import { Config } from './config';

let whitelist: string[];
if (Config.ENV === 'production') {
  whitelist = [
    'https://skyhitz.io',
    'https://api.skyhitz.io',
    'http://localhost:19006',
    'https://api.stripe.com',
  ];
} else {
  whitelist = [
    'https://skyhitz.io',
    'https://vice.skyhitz.io',
    'http://localhost:3000',
    'http://localhost:4000',
    'http://localhost:19006',
    'https://api-staging.skyhitz.io',
    'https://api.stripe.com',
  ];
}

export let corsOptions = {
  origin: function (origin: any, callback: any) {
    // allow requests with no origin like mobile apps or curl requests
    if (!origin) return callback(null, true);

    if (whitelist.indexOf(origin) === -1) {
      var msg =
        'The CORS policy for this site does not ' +
        'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
};
