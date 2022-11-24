import { GraphQLError } from 'graphql';
import { getEntry } from '../algolia/algolia';
import { Config } from '../config';
import { AxiosCacheStellarClient } from '../util/axios-cache';

export const entryByIdResolver = async (_: any, { id }: any) => {
  let entry;
  try {
    entry = await getEntry(id);
  } catch (ex) {
    throw new GraphQLError('Entry with given id does not exist');
  }
  const api = AxiosCacheStellarClient as any;
  const assetId = `${entry.code}-${entry.issuer}`;
  try {
    const [holders, history, offers] = await Promise.all([
      fetchHolders(assetId, api),
      fetchHistory(assetId, api),
      fetchOffers(assetId, api),
    ]);
    return { ...entry, holders, history, offers };
  } catch (ex) {
    throw "Couldn't fetch entry data";
  }
};

const fetchHolders = async (assetId: string, api: any) => {
  const url = `${Config.STELLAR_NETWORK}/asset/${assetId}/holders?limit=100`;
  const res = await api.get(url).then(({ data }) => data._embedded.records);
  return res;
};

const fetchHistory = async (assetId: string, api: any) => {
  const url = `${Config.STELLAR_NETWORK}/asset/${assetId}/history/all?limit=100`;
  const res = await api.get(url).then(({ data }) => data._embedded.records);
  return res;
};

const fetchOffers = async (assetId: string, api: any) => {
  const url = `${Config.STELLAR_NETWORK}/asset/${assetId}/history/offers?limit=100&order=desc`;
  const res = await api.get(url).then(({ data }) => data._embedded.records);
  return res;
};
