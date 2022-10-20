import axios from 'axios';
import { entriesIndex, usersIndex } from 'src/algolia/algolia';
import { Config } from 'src/config';
import { ipfsProtocol, pinataApi } from 'src/constants/constants';
import { Entry, User } from './types';

export async function pinExistingUserImages() {
  const res = await usersIndex.search('', {
    hitsPerPage: 1000,
  });
  for (const i in res.hits) {
    const hit = res.hits[i] as unknown;
    const user = hit as User;

    if (user.avatarUrl?.startsWith(ipfsProtocol)) {
      const result = await axios
        .post(
          `${pinataApi}/pinning/pinByHash`,
          {
            hashToPin: user.avatarUrl.replace(ipfsProtocol, ''),
            pinataMetadata: {
              name: `${user.username}-image`,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${Config.PINATA_JWT}`,
              'Content-Type': 'application/json',
            },
          }
        )
        .then(({ data }) => data)
        .catch((error) => {
          console.log(error);
          console.log(error.response.data.error);
          return null;
        });
      if (!result) {
        return false;
      }
      console.log(result);
    }
  }

  return true;
}

export async function pinExistingEntryImages() {
  const res = await entriesIndex.search('', { hitsPerPage: 1000 });
  for (const i in res.hits) {
    const hit = res.hits[i] as unknown;
    const entry = hit as Entry;

    const result = await axios
      .post(
        `${pinataApi}/pinning/pinByHash`,
        {
          hashToPin: entry.imageUrl.replace(ipfsProtocol, ''),
          pinataMetadata: {
            name: `${entry.title}-image`,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${Config.PINATA_JWT}`,
            'Content-Type': 'application/json',
          },
        }
      )
      .then(({ data }) => data)
      .catch((error) => {
        console.log(error);
        console.log(error.response.data.error);
        return null;
      });
    if (!result) {
      return false;
    }
    console.log(result);
  }

  return true;
}
