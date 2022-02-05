import { getAuthenticatedUser } from '../auth/logic';
import { getXlmInUsdDexPrice } from '../stellar/operations';
import { GraphQLString } from 'graphql';

const XLMPrice = {
  type: GraphQLString,
  async resolve(root: any, args: any, ctx: any) {
    await getAuthenticatedUser(ctx);

    let { price } = await getXlmInUsdDexPrice();
    return price;
  },
};

export default XLMPrice;
