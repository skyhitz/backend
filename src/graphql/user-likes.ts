import { GraphQLList } from 'graphql';
import Entry from './types/entry';
import { getAuthenticatedUser } from '../auth/logic';
import { getEntriesLikesWithUserId } from 'src/algolia/algolia';

const UserLikes = {
  type: new GraphQLList(Entry),
  async resolve(_: any, args: any, ctx: any) {
    let user = await getAuthenticatedUser(ctx);

    const entriesArr = await getEntriesLikesWithUserId(user.id);

    return entriesArr.map(
      ({
        imageUrl,
        videoUrl,
        description,
        title,
        id,
        forSale,
        price,
        artist,
      }) => {
        return {
          imageUrl: imageUrl,
          videoUrl: videoUrl,
          description: description,
          title: title,
          id: id,
          forSale: forSale,
          price: price,
          artist: artist,
        };
      }
    );
  },
};

export default UserLikes;
