import algoliasearch from 'algoliasearch';
import { User, Entry, HiddenBid } from '../util/types';
import { Config } from '../config/index';
import { pinataGateway } from '../constants/constants';
const client = algoliasearch(
  Config.ALGOLIA_APP_ID,
  Config.ALGOLIA_ADMIN_API_KEY
);
export const appDomain = Config.APP_URL.replace('https://', '');
export const entriesIndex = client.initIndex(`${appDomain}:entries`);
entriesIndex.setSettings({
  searchableAttributes: ['unordered(title,artist)', 'description', 'code'],
  replicas: [
    `${appDomain}:entries_likes_desc`,
    `${appDomain}:entries_timestamp_desc`,
    `${appDomain}:entries_timestamp_asc`,
    `${appDomain}:entries_rating_desc`,
  ],
  attributesForFaceting: [
    'filterOnly(code)',
    'filterOnly(issuer)',
    'filterOnly(id)',
  ],
  attributesToRetrieve: ['*'],
});
export const usersIndex = client.initIndex(`${appDomain}:users`);
export const passwordlessIndex = client.initIndex(`${appDomain}:pwdless`);
export const likesIndex = client.initIndex(`${appDomain}:likes`);
export const likeCountReplicaIndex = client.initIndex(
  `${appDomain}:entries_likes_desc`
);

likeCountReplicaIndex.setSettings({
  ranking: ['desc(likeCount)'],
  attributesToRetrieve: ['*'],
});

export const ratingReplicaIndex = client.initIndex(
  `${appDomain}:entries_rating_desc`
);

ratingReplicaIndex.setSettings({
  ranking: ['desc(rating)'],
  attributesToRetrieve: ['*'],
});

export const timestampReplicaDesc = client.initIndex(
  `${appDomain}:entries_timestamp_desc`
);

export const timestampReplicaAsc = client.initIndex(
  `${appDomain}:entries_timestamp_asc`
);

timestampReplicaDesc.setSettings({
  ranking: ['desc(publishedAtTimestamp)'],
  attributesForFaceting: ['filterOnly(publishedAtTimestamp)'],
  attributesToRetrieve: ['*'],
});

timestampReplicaAsc.setSettings({
  ranking: ['asc(publishedAtTimestamp)'],
  attributesForFaceting: ['filterOnly(publishedAtTimestamp)'],
  attributesToRetrieve: ['*'],
});

usersIndex.setSettings({
  searchableAttributes: ['username', 'email', 'publicKey'],
  attributesForFaceting: [
    'filterOnly(username)',
    'filterOnly(email)',
    'filterOnly(publicKey)',
    'filterOnly(id)',
  ],
  attributesToRetrieve: ['*'],
});

likesIndex.setSettings({
  searchableAttributes: ['objectID'],
  attributesForFaceting: ['filterOnly(objectID)'],
  attributesToRetrieve: ['*'],
});

export const hiddenBidsIndex = client.initIndex(`${appDomain}:hidden-bids`);
hiddenBidsIndex.setSettings({
  searchableAttributes: ['hiddenBy', 'offerId'],
  attributesForFaceting: [
    'filterOnly(hiddenBy)',
    'filterOnly(offerId)',
    'filterOnly(id)',
  ],
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

export async function hideBid(offerId: string, publicKey: string) {
  try {
    const previousObject = await hiddenBidsIndex.getObject<HiddenBid>(offerId);
    const hiddenBy = [...previousObject.hiddenBy, publicKey];
    return await hiddenBidsIndex.partialUpdateObject({
      ...previousObject,
      hiddenBy,
    });
  } catch (ex) {
    const newObject = {
      objectID: offerId,
      id: offerId,
      hiddenBy: [publicKey],
    };
    return await hiddenBidsIndex.saveObject(newObject);
  }
}

export async function cancelBid(offerId: string) {
  return await hiddenBidsIndex.deleteObject(offerId);
}

export async function getUserHiddenBids(publicKey: string): Promise<String[]> {
  const results = await hiddenBidsIndex.search<HiddenBid>('', {
    filters: `hiddenBy:${publicKey}`,
  });
  return results.hits.map((item) => item.id);
}

export async function saveEntry(entry: Entry) {
  return entriesIndex.saveObject(entry);
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

export async function getByUsernameOrEmailOrPublicKey(
  username: string,
  email: string,
  publicKey?: string
) {
  const res = await usersIndex.search<User>('', {
    filters: `username:${username} OR email:${email} ${
      publicKey ? 'OR publicKey:' + publicKey : ''
    }`,
  });
  const [user] = res.hits;
  return user;
}

export async function getByUsernameOrEmailExcludingId(
  username: string,
  email: string,
  id: string
) {
  const res = await usersIndex.search<User>('', {
    filters: `(username:${username} OR email:${email}) AND NOT objectID:"${id}"`,
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
  if (res.hits.length === 0) {
    throw 'User not found';
  }
  const [user] = res.hits;
  return user as User;
}

export async function saveUser(user) {
  await usersIndex.saveObject(user).wait();
}

export async function likeMulti(userId, entryId) {
  const { likeCount } = await getEntry(entryId);
  const likeCountNumber = likeCount ? likeCount + 1 : 1;
  console.log('like count:', likeCount);

  try {
    await Promise.all([
      likesIndex.saveObject({
        objectID: `user${userId}entry${entryId}`,
        likeCount: likeCountNumber ? likeCountNumber : 0,
        entryId: entryId,
        userId: userId,
      }),
      likesIndex.saveObject({
        objectID: `entry${entryId}user${userId}`,
        likeCount: likeCountNumber ? likeCountNumber : 0,
        entryId: entryId,
        userId: userId,
      }),
      entriesIndex.partialUpdateObject({
        objectID: entryId,
        likeCount: {
          _operation: 'Increment',
          value: likeCountNumber ? likeCountNumber : 0,
        },
      }),
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
      likesIndex.deleteObject(`user${userId}entry${entryId}`),
      likesIndex.deleteObject(`entry${entryId}user${userId}`),
      entriesIndex.partialUpdateObject({
        objectID: entryId,
        likeCount: {
          _operation: 'Decrement',
          value: likeCountNumber ? likeCountNumber : 0,
        },
      }),
    ]);
    return true;
  } catch (e) {
    return false;
  }
}

export async function getUsersLikesWithEntryId(entryId) {
  const prefix = 'user';
  const likes = await likesIndex.search(`entry${entryId}`);
  const users = await usersIndex.getObjects(
    likes.hits.map(({ objectID }) =>
      objectID.substring(objectID.lastIndexOf(prefix) + prefix.length)
    )
  );
  return users.results as User[];
}

export async function getEntriesLikesWithUserId(userId) {
  const prefix = 'entry';
  const likes = await likesIndex.search(`user${userId}`);
  const objectIDs = likes.hits.map(({ objectID }) =>
    objectID.substring(objectID.lastIndexOf(prefix) + prefix.length)
  );
  const entries = await entriesIndex.getObjects(objectIDs);

  return entries.results as unknown as Entry[];
}

const pinataResizedGateway = (ipfsHash: string) =>
  `${pinataGateway}/ipfs/${ipfsHash}?img-width=200&img-height=200`;

export async function assetsMeta(
  publishedAtTimestamp,
  limit = 200,
  order = 'desc'
) {
  const isDesc = order === 'desc';
  const assetIndex = isDesc ? timestampReplicaDesc : timestampReplicaAsc;

  const res = await assetIndex.search('', {
    hitsPerPage: limit,
    filters: isDesc
      ? `publishedAtTimestamp < ${publishedAtTimestamp}`
      : `publishedAtTimestamp > ${publishedAtTimestamp}`,
  });
  return res.hits
    .map((hit: unknown) => hit as Entry)
    .map(
      ({
        issuer,
        code,
        description,
        artist,
        title,
        imageUrl,
        publishedAtTimestamp,
        videoUrl,
      }) => ({
        issuer: issuer,
        code: code,
        description: description,
        name: `${artist} - ${title}`.substring(0, 20),
        image: pinataResizedGateway(imageUrl.replace('ipfs://', '')),
        fixed_number: 1,
        timestamp: publishedAtTimestamp,
        anchor_asset_type: 'nft',
        status: 'live',
        url: videoUrl,
      })
    );
}

export async function findAssetMeta(code, issuer) {
  const res = await entriesIndex.search('', {
    filters: `code:${code} OR issuer:${issuer}`,
  });
  return res.hits
    .map((hit: unknown) => hit as Entry)
    .map(
      ({
        issuer,
        code,
        description,
        artist,
        title,
        imageUrl,
        publishedAtTimestamp,
        videoUrl,
      }) => ({
        issuer: issuer,
        code: code,
        description: description,
        name: `${artist} - ${title}`.substring(0, 20),
        image: pinataResizedGateway(imageUrl.replace('ipfs://', '')),
        fixed_number: 1,
        timestamp: publishedAtTimestamp,
        anchor_asset_type: 'nft',
        status: 'live',
        url: videoUrl,
      })
    );
}
