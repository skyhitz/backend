import axios from 'axios';
import cron from 'node-cron';
import { entriesIndex } from '../algolia/algolia';
import { Config } from '../config';
import { Entry } from './types';

export function intiliazeCronJobs() {
  cron.schedule('0 0 * * *', async () => {
    let entries: Entry[] = [];
    const response = await entriesIndex.search('', {
      hitsPerPage: 1000,
      page: 0,
    });
    entries = entries.concat(response.hits.map((hit: unknown) => hit as Entry));
    const numberOfPages = response.nbPages;
    for (let page = 1; page < numberOfPages; page++) {
      const response = await entriesIndex.search('', {
        hitsPerPage: 1000,
        page,
      });
      entries = entries.concat(
        response.hits.map((hit: unknown) => hit as Entry)
      );
    }

    const updates = [];
    for (const index in entries) {
      const entry = entries[index];
      const assetId = `${entry.code}-${entry.issuer}`;
      const data = await axios
        .get(
          `https://api.stellar.expert/explorer/${Config.STELLAR_NETWORK}/asset/${assetId}/rating`
        )
        .then(({ data }) => data)
        .catch((error) => {
          console.log(error);
          return null;
        });
      const rating = data.rating.average;
      const entryUpdate = {
        ...entry,
        rating,
      };
      updates.push(entryUpdate);
    }
    await entriesIndex.partialUpdateObjects(updates);
    console.log('Updated entries rating');
  });
}
