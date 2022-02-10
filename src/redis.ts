const { promisify } = require('util');
import { Config } from './config';
import { RedisClient, createClient } from 'redis';
import { UserPayload } from './util/types';
import { chunk } from './util/chunk';

export const redisClient: RedisClient = createClient({
  host: Config.REDIS_HOST,
  port: Config.REDIS_PORT,
  password: Config.REDIS_KEY,
});

redisClient.on('connect', () => {
  const socket = redisClient.stream;
  (socket as any).setKeepAlive(true, 30 * 1000);
});

export const get = promisify(redisClient.get).bind(redisClient);
export const mget = promisify(redisClient.mget).bind(redisClient);
export const getAll = promisify(redisClient.hgetall).bind(redisClient);
export const keys = promisify(redisClient.keys).bind(redisClient);
export const smembers = promisify(redisClient.smembers).bind(redisClient);
export const sendCommand = promisify(redisClient.send_command).bind(
  redisClient
);
export const sadd = promisify(redisClient.sadd).bind(redisClient);
export const hset = promisify(redisClient.hset).bind(redisClient);
export const hdel = promisify(redisClient.hdel).bind(redisClient);
export const hmset = promisify(redisClient.hmset).bind(redisClient);
export const scard = promisify(redisClient.scard).bind(redisClient);

export function setUser(user: UserPayload) {
  let key = 'all-users';

  return new Promise((resolve, reject) => {
    if (user.publicKey) {
      redisClient
        .multi()
        .hmset(
          `users:${user.id}`,
          'avatarUrl',
          user.avatarUrl,
          'displayName',
          user.displayName,
          'email',
          user.email,
          'publishedAt',
          user.publishedAt,
          'username',
          user.username.toLowerCase(),
          'id',
          user.id,
          'version',
          user.version,
          'description',
          user.description,
          'publishedAtTimestamp',
          user.publishedAtTimestamp,
          'publicKey',
          user.publicKey,
          'seed',
          user.seed ? user.seed : ''
        )
        .sadd(`usernames:${user.username.toLowerCase()}`, user.id)
        .sadd(`emails:${user.email}`, user.id)
        .sadd(`publicKeys:${user.publicKey}`, user.id)
        .sadd(key, user.id)
        .exec((err) => {
          if (err) {
            return reject(err);
          }
          resolve(user);
        });
    } else {
      redisClient
        .multi()
        .hmset(
          `users:${user.id}`,
          'avatarUrl',
          user.avatarUrl,
          'displayName',
          user.displayName,
          'email',
          user.email,
          'publishedAt',
          user.publishedAt,
          'username',
          user.username.toLowerCase(),
          'id',
          user.id,
          'version',
          user.version,
          'description',
          user.description,
          'publishedAtTimestamp',
          user.publishedAtTimestamp,
          'publicKey',
          '',
          'seed',
          user.seed ? user.seed : ''
        )
        .sadd(`usernames:${user.username.toLowerCase()}`, user.id)
        .sadd(`emails:${user.email}`, user.id)
        .sadd(key, user.id)
        .exec((err) => {
          if (err) {
            return reject(err);
          }
          resolve(user);
        });
    }
  });
}

export function updateUser(user) {
  return new Promise((resolve, reject) => {
    redisClient
      .multi()
      .hmset(
        `users:${user.id}`,
        'avatarUrl',
        user.avatarUrl,
        'displayName',
        user.displayName,
        'email',
        user.email,
        'publishedAt',
        user.publishedAt,
        'username',
        user.username.toLowerCase(),
        'id',
        user.id,
        'password',
        user.password,
        'version',
        user.version,
        'description',
        user.description,
        'publishedAtTimestamp',
        user.publishedAtTimestamp
      )
      .sadd(`usernames:${user.username.toLowerCase()}`, user.id)
      .sadd(`emails:${user.email}`, user.id)
      .exec((err) => {
        if (err) {
          return reject(err);
        }
        resolve(user);
      });
  });
}

export function updateEntry(entry) {
  return new Promise((resolve, reject) => {
    redisClient
      .multi()
      .hmset(
        `entries:${entry.id}`,
        'description',
        entry.description,
        'title',
        entry.title,
        'id',
        entry.id,
        'videoUrl',
        entry.videoUrl,
        'imageUrl',
        entry.imageUrl,
        'etag',
        entry.etag,
        'publishedAt',
        entry.publishedAt,
        'publishedAtTimestamp',
        parseInt(entry.publishedAtTimestamp),
        'price',
        parseInt(entry.price),
        'forSale',
        entry.forSale,
        'artist',
        entry.artist
      )
      .exec((err) => {
        if (err) {
          return reject();
        }
        return resolve(null);
      });
  });
}

export async function setEntry(entry, toml): Promise<number> {
  let key = 'all-entries';
  return new Promise((resolve, reject) => {
    redisClient
      .multi()
      .hmset(`toml:${entry.id.substr(0, 12)}`, 'toml', toml)
      .hmset(
        `entries:${entry.id}`,
        'description',
        entry.description,
        'title',
        entry.title,
        'id',
        entry.id,
        'videoUrl',
        entry.videoUrl,
        'imageUrl',
        entry.imageUrl,
        'publishedAt',
        entry.publishedAt,
        'publishedAtTimestamp',
        parseInt(entry.publishedAtTimestamp),
        'price',
        parseInt(entry.price),
        'forSale',
        entry.forSale,
        'equityForSale',
        parseInt(entry.equityForSale),
        'artist',
        entry.artist,
        'code',
        entry.code,
        'issuer',
        entry.issuer
      )
      .sadd(`${key}`, entry.id)
      .exec(async (err) => {
        if (err) {
          console.log(err);
          return reject();
        }
        const totalEntries = await scard(key);
        return resolve(totalEntries);
      });
  });
}

export async function recentlyAdded() {
  return chunk(
    await sendCommand('sort', [
      'all-entries',
      'limit',
      '0',
      '20',
      'by',
      'entries:*->publishedAtTimestamp',
      'desc',
      'get',
      'entries:*->imageUrl',
      'get',
      'entries:*->videoUrl',
      'get',
      'entries:*->description',
      'get',
      'entries:*->title',
      'get',
      'entries:*->id',
      'get',
      'entries:*->forSale',
      'get',
      'entries:*->price',
      'get',
      'entries:*->artist',
    ]),
    8
  ).map(
    ([imageUrl, videoUrl, description, title, id, forSale, price, artist]) => {
      return {
        imageUrl: imageUrl,
        videoUrl: videoUrl,
        description: description,
        title: title,
        id: id,
        forSale: forSale === 'true',
        price: parseInt(price),
        artist: artist,
      };
    }
  );
}

// ft.search idx:entries * sortby publishedAtTimestamp desc return 2 title id limit 0 200

export async function assetsMetaSortedByPublishedTimestamp(
  limit = 200,
  order = 'desc',
  cursor = 0
) {
  return chunk(
    await sendCommand('ft.search', [
      'idx:entries',
      '*',
      'sortby',
      'publishedAtTimestamp',
      order,
      'limit',
      cursor,
      limit,
      'return',
      '6',
      'issuer',
      'code',
      'description',
      'image',
      'artist',
      'title',
    ]),
    6
  ).map(([issuer, code, description, image, artist, title]: string[]) => {
    return {
      issuer: issuer,
      code: code,
      description: description,
      name: `${artist} - ${title}`,
      image: image.replace(
        'ipfs://',
        'https://skyhitz.io/cdn-cgi/image/width=200/https://cloudflare-ipfs.com/ipfs/'
      ),
      fixed_number: 1,
    };
  });
}

export async function assetsMeta(
  publishedAtTimestamp,
  limit = 200,
  order = 'desc'
) {
  return chunk(
    await sendCommand('ft.search', [
      'idx:entries',
      order === 'asc'
        ? `@publishedAtTimestamp:[${publishedAtTimestamp} 5000000000]`
        : `@publishedAtTimestamp:[0 ${publishedAtTimestamp}]`,
      'sortby',
      'publishedAtTimestamp',
      order,
      'limit',
      '0',
      limit,
      'return',
      '6',
      'issuer',
      'code',
      'description',
      'image',
      'artist',
      'title',
    ]),
    6
  ).map(([issuer, code, description, image, artist, title]: string[]) => {
    return {
      issuer: issuer,
      code: code,
      description: description,
      name: `${artist} - ${title}`,
      image: image.replace(
        'ipfs://',
        'https://skyhitz.io/cdn-cgi/image/width=200/https://cloudflare-ipfs.com/ipfs/'
      ),
      fixed_number: 1,
    };
  });
}

export async function findAssetMeta(code?: string, issuer?: string) {
  return chunk(
    await sendCommand('ft.search', [
      'idx:entries',
      code && issuer
        ? `@code:${code} @issuer:${issuer}`
        : code
        ? `@code:${code}`
        : `@issuer:${issuer}`,
      'return',
      '7',
      'issuer',
      'code',
      'description',
      'image',
      'artist',
      'title',
      'publishedAtTimestamp',
    ]),
    7
  ).map(
    ([
      issuer,
      code,
      description,
      image,
      artist,
      title,
      publishedAtTimestamp,
    ]: string[]) => {
      return {
        issuer: issuer,
        code: code,
        description: description,
        name: `${artist} - ${title}`,
        image: image.replace(
          'ipfs://',
          'https://skyhitz.io/cdn-cgi/image/width=200/https://cloudflare-ipfs.com/ipfs/'
        ),
        fixed_number: 1,
        publishedAtTimestamp: publishedAtTimestamp,
      };
    }
  );
}
