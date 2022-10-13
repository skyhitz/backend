import { setup } from 'axios-cache-adapter';

export const AxiosCacheStellarClient = setup({
  baseURL: 'https://api.stellar.expert/explorer/',
  cache: {
    maxAge: 15 * 60 * 1000,
    exclude: {
      query: false,
    },
  },
});
