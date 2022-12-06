import { setup } from 'axios-cache-adapter';

export const AxiosCacheStellarClient = setup({
  baseURL: 'https://api.stellar.expert/explorer/',
  cache: {
    maxAge: 15 * 60 * 1000,
    exclude: {
      query: false,
    },
  },
}) as any;

export const deleteCache = (excludeKeys: string[]) => {
  const filteredPairs = Object.entries(
    AxiosCacheStellarClient.cache.store
  ).filter(([key]) => !excludeKeys.includes(key));
  AxiosCacheStellarClient.cache.store = Object.fromEntries(filteredPairs);
};
