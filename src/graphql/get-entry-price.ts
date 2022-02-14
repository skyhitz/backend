import { GraphQLString } from 'graphql';
import EntryPrice from './types/entry-price';
import { getAuthenticatedUser } from '../auth/logic';
// import { getAll } from '../redis';
import { getAsks } from '../stellar/operations';

const getEntryAsk = async (id) => {
  // let res = await getAll(`assets:entry:${id}`);
  let res = await Promise.resolve(null);
  if (res) {
    const [assetCode] = Object.keys(res);
    let { price, amount } = await getAsks(assetCode);
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
