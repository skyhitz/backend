import algoliasearch from 'algoliasearch';
import { Config } from '../config/index';
const client = algoliasearch(
  Config.ALGOLIA_APP_ID,
  Config.ALGOLIA_ADMIN_API_KEY
);
const appDomain = Config.APP_URL.replace('https://', '');
export const entriesIndex = client.initIndex(`${appDomain}:entries`);
export const usersIndex = client.initIndex(`${appDomain}:users`);

usersIndex.setSettings({
  searchableAttributes: ['username', 'email', 'publicKey'],
  attributesForFaceting: [
    'filterOnly(username)',
    'filterOnly(email)',
    'filterOnly(publicKey)',
  ],
  attributesToRetrieve: ['avatarUrl', 'displayName', 'id', 'username'],
});

// Always pass objectID
export async function partialUpdateObject(obj: any) {
  return new Promise((resolve, reject) => {
    entriesIndex.partialUpdateObject(obj, (err: any, content: any) => {
      if (err) {
        return reject(err);
      }

      resolve(content);
    });
  });
}

export async function getByUsernameOrEmailOrPublicKey(
  username: string,
  email: string,
  publicKey?: string
) {
  const res = await usersIndex.search('', {
    filters: `username:${username} OR email:${email} ${
      publicKey ? 'OR publicKey:' + publicKey : ''
    }`,
  });
  const [user] = res.hits;
  return user;
}

export async function saveUser(user) {
  await usersIndex.saveObject(user);
}
