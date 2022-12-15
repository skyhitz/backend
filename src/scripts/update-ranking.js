const axios = require('axios').default;
const algoliasearch = require('algoliasearch');

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_API_KEY
);

const config = {
  staging: {
    appDomain: 'skyhitz-expo-next.vercel.app',
    stellarNetwork: 'testnet',
  },
  production: {
    appDomain: 'skyhitz.io',
    stellarNetwork: 'public',
  },
};

async function updateRanking() {
  for (const key in config) {
    console.log(key);
    const currentConfig = config[key];
    console.log(currentConfig);
    const entriesIndex = client.initIndex(`${currentConfig.appDomain}:entries`);
    let entries = [];
    const response = await entriesIndex.search('', {
      hitsPerPage: 1000,
      page: 0,
    });
    entries = entries.concat(response.hits);
    const numberOfPages = response.nbPages;
    for (let page = 1; page < numberOfPages; page++) {
      const response = await entriesIndex.search('', {
        hitsPerPage: 1000,
        page,
      });
      entries = entries.concat(response.hits);
    }

    console.log(entries);

    const updates = [];
    for (const index in entries) {
      const entry = entries[index];
      const assetId = `${entry.code}-${entry.issuer}`;
      const data = await axios
        .get(
          `https://api.stellar.expert/explorer/${currentConfig.stellarNetwork}/asset/${assetId}/rating`
        )
        .then(({ data }) => data)
        .catch((error) => {
          console.log(error);
          return null;
        });
      console.log(data);
      const rating = data.rating.average;
      const entryUpdate = {
        ...entry,
        rating,
      };
      updates.push(entryUpdate);
    }
    await entriesIndex.partialUpdateObjects(updates);
    console.log('Updated entries rating');
  }
}

updateRanking();
