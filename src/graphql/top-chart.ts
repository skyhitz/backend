import { GraphQLList } from 'graphql';
import Entry from './types/entry';
import { getAuthenticatedUser } from '../auth/logic';
import { chunk } from '../util/chunk';
import { sendCommand } from '../redis';

const TopChart = {
  type: new GraphQLList(Entry),
  async resolve(root: any, args: any, ctx: any) {
    await getAuthenticatedUser(ctx);
    let key = 'all-entries';
    let entries = await sendCommand('sort', [
      key,
      'by',
      'entries:*->likesCount',
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
    ]);

    return chunk(entries, 8).map(
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

export default TopChart;
