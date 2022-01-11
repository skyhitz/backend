import { GraphQLBoolean, GraphQLNonNull } from 'graphql';
import { getAuthenticatedUser } from '../auth/logic';
import { GraphQLUpload } from 'graphql-upload';

const singleUpload = {
  type: GraphQLBoolean,
  args: {
    file: {
      type: new GraphQLNonNull(GraphQLUpload),
    },
  },
  async resolve(_: any, { file }: any, ctx: any) {
    await getAuthenticatedUser(ctx);
    try {
      const { createReadStream, mimetype } = await file;
      console.log('mimetype: ', mimetype);
      console.log('create read stream: ', createReadStream);
      return true;
    } catch (e) {
      return false;
    }
  },
};

export default singleUpload;
