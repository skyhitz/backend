import { GraphQLNonNull, GraphQLString } from 'graphql';
import { getEntry } from '../algolia/algolia';
import { Config } from 'src/config';
import { AxiosCacheStellarClient } from 'src/util/axios-cache';
import { EntryDetails } from './types/entry-details';

export const EntryById = {
  type: EntryDetails,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  async resolve(_: any, { id }: any) {
    const entry = await getEntry(id);
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
  },
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
