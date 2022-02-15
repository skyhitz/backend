import algoliasearch from 'algoliasearch';
import { User } from 'src/util/types';
import { Config } from '../config/index';
const client = algoliasearch(
  Config.ALGOLIA_APP_ID,
  Config.ALGOLIA_ADMIN_API_KEY
);
const appDomain = Config.APP_URL.replace('https://', '');
export const entriesIndex = client.initIndex(`${appDomain}:entries`);
export const usersIndex = client.initIndex(`${appDomain}:users`);
export const passwordlessIndex = client.initIndex(`${appDomain}:pwdless`);
export const issuersIndex = client.initIndex(`${appDomain}:issuers`);

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

export async function getUser(id): Promise<User> {
  return usersIndex.getObject(id);
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

export async function getUserByEmail(email: string) {
  const res = await usersIndex.search('', {
    filters: `email:${email}`,
  });
  const [user] = res.hits;
  return user as User;
}

export async function saveUser(user) {
  await usersIndex.saveObject(user);
}

export async function setIssuer(user, seed): Promise<boolean> {
  try {
    await issuersIndex.saveObject({ seed: seed, objectID: user.id });
    return true;
  } catch (e) {
    return false;
  }
}
