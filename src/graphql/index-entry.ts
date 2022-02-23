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

    const currentHomedomain =
      Config.ENV === 'production' ? `skyhitz.io` : `vice.skyhitz.io`;

    if (home_domain !== currentHomedomain) {
      throw `Can't index NFTs from other marketplaces at the moment`;
    }

    const { ipfshash } = data;

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
      .get(`${cloudflareIpfsGateway}/${ipfshash}`)
      .then(({ data }) => data);

    const nameDivider = ' - ';

    if (
      name &&
      description &&
      metaCode & metaIssuer & domain & supply & image & animation_url & video
    ) {
      await saveEntry({
        description,
        code: metaCode,
        issuer: metaIssuer,
        imageUrl: image,
        videoUrl: video,
        id: ipfshash,
        objectID: ipfshash,
        likeCount: 0,
        title: name.substring(name.indexOf(nameDivider) + nameDivider.length),
        artist: name.substring(0, name.indexOf(nameDivider)),
        publishedAt: new Date().toISOString(),
        publishedAtTimestamp: Math.floor(new Date().getTime() / 1000),
      });
      return true;
    }
    return false;
  },
};

export default indexEntry;
