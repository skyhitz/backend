const { promisify } = require('util');
import { Config } from './config';
import { RedisClient, createClient } from 'redis';
import { UserPayload } from './util/types';

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
