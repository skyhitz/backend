import { GraphQLString, GraphQLBoolean } from 'graphql';
import { getAuthenticatedUser } from '../auth/logic';
import { uploadVideoToYoutube } from '../youtube/youtube-upload';
import { getAll, updateEntry } from '../redis';

const youtubeUpload = {
  type: GraphQLBoolean,
  args: {
    videoUrl: {
      type: GraphQLString,
    },
    title: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    id: {
      type: GraphQLString,
    },
  },
  async resolve(_: any, { videoUrl, title, description, id }: any, ctx: any) {
    await getAuthenticatedUser(ctx);
    const youtubeId = await uploadVideoToYoutube(videoUrl, title, description);
    const entry = await getAll(`entries:${id}`);
    entry.youtubeId = youtubeId;
    await updateEntry(entry);
    return true;
  },
};

export default youtubeUpload;
