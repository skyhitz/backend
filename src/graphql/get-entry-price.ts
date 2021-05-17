import { GraphQLString } from 'graphql';
import EntryPrice from './types/entry-price';
import { getAuthenticatedUser } from '../auth/logic';
import { getAll } from '../redis';
import { getBid } from '../payments/stellar';

export default {
  type: EntryPrice,
  args: {
    id: {
      type: GraphQLString,
    },
  },
  async resolve(root: any, { id }: any, ctx: any) {
    await getAuthenticatedUser(ctx);

    let res = await getAll(`assets:entry:${id}`);
    if (res) {
      const [assetCode] = Object.keys(res);
      let bid = await getBid(assetCode);
      return { price: bid.price, amount: bid.amount };
    }
    return { price: 0, amount: 0 };
  },
};
