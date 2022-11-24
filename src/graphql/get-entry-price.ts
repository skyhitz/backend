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

export const entryPriceResolver = async (_root: any, { id }: any, ctx: any) => {
  await getAuthenticatedUser(ctx);

  return getEntryAsk(id);
};
