import algoliasearch from 'algoliasearch';
import { User, Entry, Issuer } from '../util/types';
import { Config } from '../config/index';
const client = algoliasearch(
  Config.ALGOLIA_APP_ID,
  Config.ALGOLIA_ADMIN_API_KEY
);
const appDomain = Config.APP_URL.replace('https://', '');
export const entriesIndex = client.initIndex(`${appDomain}:entries`);
entriesIndex.setSettings({
  replicas: [`${appDomain}:entries_likes_desc`],
  attributesToRetrieve: ['*'],
});
export const usersIndex = client.initIndex(`${appDomain}:users`);
export const passwordlessIndex = client.initIndex(`${appDomain}:pwdless`);
export const issuersIndex = client.initIndex(`${appDomain}:issuers`);
export const likesIndex = client.initIndex(`${appDomain}:likes`);
export const likeCountReplicaIndex = client.initIndex(
  `${appDomain}:entries_likes_desc`
);

likeCountReplicaIndex.setSettings({
  ranking: ['desc(likeCount)'],
  attributesToRetrieve: ['*'],
});

usersIndex.setSettings({
  searchableAttributes: ['username', 'email', 'publicKey'],
  attributesForFaceting: [
    'filterOnly(username)',
    'filterOnly(email)',
    'filterOnly(publicKey)',
  ],
  attributesToRetrieve: ['*'],
});

likesIndex.setSettings({
  searchableAttributes: ['objectID'],
  attributesForFaceting: ['filterOnly(objectID)'],
  attributesToRetrieve: ['*'],
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

export async function getEntry(id): Promise<Entry> {
  return entriesIndex.getObject(id);
}

export async function deleteEntry(id: string) {
  try {
    await entriesIndex.deleteObject(id);
  } catch (e) {
    console.log('error deleting entry:', e);
    return false;
  }

  return true;
}

export async function getEntryByCode(code: string) {
  const res = await entriesIndex.search('', {
    filters: `code:${code}`,
  });
  const [entry]: unknown[] = res.hits;
  return entry as Entry;
}

export async function recentlyAdded() {
  const res = await entriesIndex.search('');
  return res.hits.map((hit: unknown) => hit as Entry);
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

export async function getUserByPublicKey(publicKey: string) {
  const res = await usersIndex.search('', {
    filters: `publicKey:${publicKey}`,
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

export async function getIssuer(userId): Promise<Issuer> {
  return issuersIndex.getObject(userId);
}

export async function likeMulti(userId, entryId) {
  let { likeCount } = await getEntry(entryId);
  let likeCountNumber = likeCount ? likeCount + 1 : 1;
  console.log('like count:', likeCount);

  try {
    await Promise.all([
      await likesIndex.saveObject({
        objectID: `user:${userId}:${entryId}`,
        likeCount: likeCountNumber ? likeCountNumber : 0,
      }),
      await likesIndex.saveObject({
        objectID: `entry:${entryId}:${userId}`,
        likeCount: likeCountNumber ? likeCountNumber : 0,
      }),
      // await partialUpdateObject({
      //   objectID: entryId,
      //   likeCount: likeCountNumber ? likeCountNumber : 0,
      // }),
    ]);
    return true;
  } catch (e) {
    return false;
  }
}

export async function unlikeMulti(userId, entryId) {
  let { likeCount } = await getEntry(entryId);
  let likeCountNumber = likeCount ? likeCount - 1 : 0;

  try {
    await Promise.all([
      await likesIndex.deleteObject(`user:${userId}:${entryId}`),
      await likesIndex.deleteObject(`entry:${entryId}:${userId}`),
      await partialUpdateObject({
        objectID: entryId,
        likeCount: likeCountNumber ? likeCountNumber : 0,
      }),
    ]);
    return true;
  } catch (e) {
    return false;
  }
}

export async function getUsersLikesWithEntryId(entryId) {
  const likes = await likesIndex.search(`entry:${entryId}`);
  const users = await usersIndex.getObjects(
    likes.hits.map(({ objectID }) => objectID)
  );
  return users.results as User[];
}

export async function getEntriesLikesWithUserId(userId) {
  const likes = await likesIndex.search(`user:${userId}`);
  const objectIDs = likes.hits.map(({ objectID }) => objectID);
  console.log('user likes:', likes);
  console.log(objectIDs);
  const entries = await entriesIndex.getObjects(objectIDs);

  console.log('entries', entries);
  return entries.results as unknown as Entry[];
}

export async function entriesByLikeCount() {
  const res = await likeCountReplicaIndex.search('');
  return res.hits.map((hit: unknown) => hit as Entry);
}
