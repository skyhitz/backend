import { GraphQLString, GraphQLBoolean, GraphQLNonNull } from 'graphql';
import { getAuthenticatedUser } from '../auth/logic';
import { entriesIndex } from '../algolia/algolia';
import { cloudinary } from '../cloudinary/cloudinary';
import { deleteVideoFromYoutube } from '../youtube/youtube-upload';
import { getAll, hdel } from '../redis';
const adminId = '-LbM3m6WKdVQAsY3zrAd';

function deleteFromCloudinary(cloudinaryPublicId: string) {
  return new Promise((resolve, reject) => {
    cloudinary.v2.api.delete_resources(
      [cloudinaryPublicId],
      { resource_type: 'video' },
      (err: any, res: any) => {
        console.log('error', err);
        console.log('response', res);
        if (err) {
          reject();
          return;
        }
        resolve(true);
        return;
      }
    );
  });
}

// TO DO: delete onwers of entry as well
async function deleteAccount(entry: any, cloudinaryPublicId: any) {
  try {
    [
      await hdel(`entries:${entry.id}`),
      await entriesIndex.deleteObject(entry.id),
      await deleteFromCloudinary(cloudinaryPublicId),
      await deleteVideoFromYoutube(entry.youtubeId),
    ];
  } catch (e) {
    console.log('error deleting entry:', e);
    return false;
  }

  return true;
}

const removeEntry = {
  type: GraphQLBoolean,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    cloudinaryPublicId: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  async resolve(_: any, { id, cloudinaryPublicId }: any, ctx: any) {
    // TO DO: id and cloudinaryPublicId are the same and should be the same
    // remove cloudinaryPublicId and replace it with id

    const user = await getAuthenticatedUser(ctx);
    let entry = await getAll(`entries:${id}`);

    if (user.id === adminId) {
      return deleteAccount(entry, cloudinaryPublicId);
    }

    try {
      const result = getAll(`owners:entries:${id}`);
      const [ownerId] = Object.keys(result);
      if (user.id !== ownerId) {
        return false;
      }
    } catch (e) {
      return false;
    }

    return deleteAccount(entry, cloudinaryPublicId);
  },
};

export default removeEntry;
