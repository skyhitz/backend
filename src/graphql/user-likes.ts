import { GraphQLList } from 'graphql';
import Entry from './types/entry';
import { getAuthenticatedUser } from '../auth/logic';
// import { sendCommand } from '../redis';
import { chunk } from '../util/chunk';

const UserLikes = {
  type: new GraphQLList(Entry),
  async resolve(_: any, args: any, ctx: any) {
    let user = await getAuthenticatedUser(ctx);
    console.log(user);
    // let entries = await sendCommand('sort', [
    //   `likes:user:${user.id}`,
    //   'by',
    //   'entries:*->publishedAtTimestamp',
    //   'desc',
    //   'get',
    //   'entries:*->imageUrl',
    //   'get',
    //   'entries:*->videoUrl',
    //   'get',
    //   'entries:*->description',
    //   'get',
    //   'entries:*->title',
    //   'get',
    //   'entries:*->id',
    //   'get',
    //   'entries:*->forSale',
    //   'get',
    //   'entries:*->price',
    //   'get',
    //   'entries:*->artist',
    // ]);

    return chunk([], 8).map(
      ([
        imageUrl,
        videoUrl,
        description,
        title,
        id,
        forSale,
        price,
        artist,
      ]) => {
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
  },
};

export default UserLikes;
