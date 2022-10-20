import { GraphQLString, GraphQLNonNull } from 'graphql';

import { getAuthenticatedUser } from '../auth/logic';
import { saveEntry } from '../algolia/algolia';
import { getAccountData } from '../stellar/operations';
import { Config } from 'src/config';
import axios from 'axios';
import {
  ipfsGateway,
  fallbackIpfsGateway,
  ipfsProtocol,
  pinataApi,
} from '../constants/constants';
import Entry from './types/entry';

const indexEntry = {
  type: Entry,
  args: {
    issuer: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  async resolve(_: any, { issuer }: any, ctx: any) {
    await getAuthenticatedUser(ctx);

    const { data, home_domain } = await getAccountData(issuer);

    const currentHomedomain = Config.APP_URL.replace('https://', '');

    if (home_domain !== currentHomedomain) {
      throw "Can't index NFTs from other marketplaces at the moment";
    }

    const { ipfshash } = data;
    const decodedIpfshash = Buffer.from(ipfshash, 'base64').toString();

    let response;

    response = await axios
      .get(`${ipfsGateway}/${decodedIpfshash}`, {
        timeout: 15 * 1000,
      })
      .then(({ data }) => data)
      .catch((error) => {
        console.log(error);
        return null;
      });
    if (response === null) {
      console.log('Trying fallback gateway');
      response = await axios
        .get(`${fallbackIpfsGateway}/${decodedIpfshash}`, {
          timeout: 15 * 1000,
        })
        .then(({ data }) => data)
        .catch((error) => {
          console.log(error);
          return null;
        });
    }

    if (response === null) {
      throw "Couldn't fetch the nft metadata from ipfs";
    }

    const {
      name,
      description,
      code: metaCode,
      issuer: metaIssuer,
      domain,
      supply,
      image,
      animation_url,
      video,
    } = response;

    const result = await axios
      .post(
        `${pinataApi}/pinning/pinByHash`,
        {
          hashToPin: image.replace(ipfsProtocol, ''),
          pinataMetadata: {
            name: `${name}-image`,
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
        return null;
      });

    if (!result) {
      throw "Couldn't pin image to pinata";
    }

    console.log('Pinned image to pinata!', result);

    const nameDivider = ' - ';
    const obj = {
      description,
      code: metaCode,
      issuer: metaIssuer,
      imageUrl: image,
      videoUrl: video,
      id: decodedIpfshash,
      objectID: decodedIpfshash,
      likeCount: 0,
      title: name.substring(name.indexOf(nameDivider) + nameDivider.length),
      artist: name.substring(0, name.indexOf(nameDivider)),
      publishedAt: new Date().toISOString(),
      publishedAtTimestamp: Math.floor(new Date().getTime() / 1000),
    };

    console.log('indexed entry:', obj);

    if (
      name &&
      description &&
      metaCode &&
      metaIssuer &&
      domain &&
      supply &&
      image &&
      animation_url &&
      video
    ) {
      try {
        await saveEntry(obj);
        return obj;
      } catch (ex) {
        throw "Couldn't index entry.";
      }
    }
    throw 'Invalid entry metadata';
  },
};

export default indexEntry;
