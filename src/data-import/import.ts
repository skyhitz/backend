import { redisClient, getAll, smembers, keys } from '../redis';
let usersRoot = 'users';
let entriesRoot = 'entries';
let ownersRoot = 'owners';
const csv = require('csv-parser');
const fs = require('fs');

export function importUsers() {
  fs.createReadStream(__dirname + '/data/users.csv')
    .pipe(csv())
    .on('data', function (data) {
      redisClient
        .multi()
        .hmset(
          `${usersRoot}:${data.id}`,
          'avatarUrl',
          data.avatarUrl,
          'displayName',
          data.displayName,
          'email',
          data.email,
          'publishedAt',
          data.publishedAt,
          'username',
          data.username.toLowerCase(),
          'id',
          data.id,
          'password',
          data.password,
          'version',
          parseInt(data.version),
          'resetPasswordToken',
          data.resetPasswordToken,
          'resetPasswordExpires',
          data.resetPasswordExpires,
          'description',
          data.description,
          'phone',
          data.phone,
          'testing',
          (data.testing === 't').toString(),
          'publishedAtTimestamp',
          parseInt(data.publishedAtTimestamp)
        )
        .sadd(`usernames:${data.username.toLowerCase()}`, data.id)
        .sadd(`emails:${data.email}`, data.id)
        .exec((err) => {
          console.log(err);
        });
    })
    .on('end', function () {});
}

export function importEntries() {
  fs.createReadStream(__dirname + '/data/entries.csv')
    .pipe(csv())
    .on('data', function (data) {
      redisClient
        .multi()
        .hmset(
          `${entriesRoot}:${data.id}`,
          'description',
          data.description,
          'title',
          data.title,
          'id',
          data.id,
          'videoUrl',
          data.videoUrl,
          'imageUrl',
          data.imageUrl,
          'etag',
          data.etag,
          'publishedAt',
          data.publishedAt,
          'publishedAtTimestamp',
          parseInt(data.publishedAtTimestamp),
          'price',
          parseInt(data.price),
          'forSale',
          (data.forSale === 't').toString(),
          'artist',
          data.artist
        )
        .sadd(`all-${entriesRoot}`, data.id)
        .exec((err) => {
          console.log(err);
        });
    })
    .on('end', function () {});
}

export function importOwners() {
  fs.createReadStream(__dirname + '/data/owners.csv')
    .pipe(csv())
    .on('data', function (data) {
      redisClient
        .multi()
        .hmset(`${ownersRoot}:entry:${data.entryId}`, data.userId, 1)
        .hmset(`${ownersRoot}:user:${data.userId}`, data.entryId, 1)
        .exec((err) => {
          console.log(err);
        });
    })
    .on('end', function () {});
}

export function importSearches() {
  fs.createReadStream(__dirname + '/data/searches.csv')
    .pipe(csv())
    .on('data', function (data) {
      redisClient
        .multi()
        .hmset(
          `searches:${data.userId}`,
          'recentEntrySearches',
          data.recentEntrySearches,
          'recentUserSearches',
          data.recentUserSearches
        )
        .exec((err) => {
          console.log(err);
        });
    })
    .on('end', function () {});
}

export function importLikes() {
  fs.createReadStream(__dirname + '/data/likes.csv')
    .pipe(csv())
    .on('data', function (data) {
      redisClient
        .multi()
        .sadd(`likes:user:${data.userId}`, data.entryId)
        .sadd(`likes:entry:${data.entryId}`, data.userId)
        .exec((err) => {
          console.log(err);
        });
    })
    .on('end', function () {});
}

export function deleteLikes() {
  redisClient.keys('likes:*', function (err, keys) {
    redisClient.del(keys, function (err, o) {
      console.log(err);
    });
  });
}

export function deleteOwners() {
  redisClient.keys('owners:*', function (err, keys) {
    redisClient.del(keys, function (err, o) {
      console.log(err);
    });
  });
}

export function addLikeCount() {
  redisClient.keys('likes:entry:*', async function (err, keys: []) {
    keys.forEach(async (element: string) => {
      let members = await smembers(element);
      let likesCount = members.length;
      let key = element.substring('likes:entry:'.length);
      let entryKey = `entries:${key}`;
      let entry = await getAll(entryKey);
      entry.likesCount = likesCount;
      redisClient
        .multi()
        .hmset(
          `${entryKey}`,
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
          (entry.forSale === 't').toString(),
          'artist',
          entry.artist,
          'likesCount',
          entry.likesCount
        )
        .exec((err) => {
          console.log(err);
        });
    });
  });
}

export async function ensureDataHasLikeCount() {
  let entryKeys = await keys('entries:*');
  entryKeys.forEach(async (key) => {
    let entry = await getAll(key);
    if (entry.likesCount) {
      return;
    }
    entry.likesCount = 0;
    redisClient
      .multi()
      .hmset(
        `${key}`,
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
        (entry.forSale === 't').toString(),
        'artist',
        entry.artist,
        'likesCount',
        entry.likesCount
      )
      .exec((err) => {
        console.log(err);
      });
  });
}

export async function updateAllUsersSets() {
  let userKeys = await keys('users:*');
  userKeys.forEach(async (key) => {
    let user = await getAll(key);
    if (user.testing === 'true') {
      redisClient
        .multi()
        .sadd(`testing:all-users`, user.id)
        .exec((err) => {
          console.log(err);
        });
    } else {
      redisClient
        .multi()
        .sadd(`all-users`, user.id)
        .exec((err) => {
          console.log(err);
        });
    }
  });
}
