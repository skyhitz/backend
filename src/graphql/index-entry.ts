import { GraphQLString, GraphQLNonNull, GraphQLBoolean } from 'graphql';

import { getAuthenticatedUser } from '../auth/logic';
import { saveEntry } from '../algolia/algolia';
import { getAccountData } from '../stellar/operations';
import { Config } from 'src/config';
import axios from 'axios';
import { cloudflareIpfsGateway } from '../constants/constants';

const indexEntry = {
  type: GraphQLBoolean,
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
      throw `Can't index NFTs from other marketplaces at the moment`;
    }

    const { ipfshash } = data;
    const decodedIpfshash = Buffer.from(ipfshash, 'base64').toString();

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
    } = await axios
      .get(`${cloudflareIpfsGateway}/${decodedIpfshash}`)
      .then(({ data }) => data);

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
      await saveEntry(obj);
      return true;
    }
    return false;
  },
};

export default indexEntry;
