import { getAuthenticatedUser } from '../auth/logic';
import { getEntriesLikesWithUserId } from '../algolia/algolia';

export const userLikesResolver = async (_: any, args: any, ctx: any) => {
  let user = await getAuthenticatedUser(ctx);

  const entriesArr = await getEntriesLikesWithUserId(user.id);

  return entriesArr.map(
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
};
