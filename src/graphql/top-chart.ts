import { GraphQLList } from 'graphql';
import Entry from './types/entry';
import { getAuthenticatedUser } from '../auth/logic';
import { entriesByLikeCount } from '../algolia/algolia';

const TopChart = {
  type: new GraphQLList(Entry),
  async resolve(root: any, args: any, ctx: any) {
    await getAuthenticatedUser(ctx);
    let entries = await entriesByLikeCount();

    return entries.map(
      ({ imageUrl, videoUrl, description, title, id, artist }) => {
        return {
          imageUrl: imageUrl,
          videoUrl: videoUrl,
          description: description,
          title: title,
          id: id,
          artist: artist,
        };
      }
    );
  },
};

export default TopChart;
