import { GraphQLString } from 'graphql';
import EntryPrice from './types/entry-price';
import { getAuthenticatedUser } from '../auth/logic';
import { getAsks } from '../stellar/operations';
import { getEntry } from '../algolia/algolia';

const getEntryAsk = async (id) => {
  let { code } = await getEntry(id);
  if (code) {
    let { price, amount } = await getAsks(code);
    return { price: price, amount: amount };
  }
  return { price: 0, amount: 0 };
};

export default {
  type: EntryPrice,
  args: {
    id: {
      type: GraphQLString,
    },
  },
  async resolve(root: any, { id }: any, ctx: any) {
    await getAuthenticatedUser(ctx);

    return getEntryAsk(id);
  },
};
