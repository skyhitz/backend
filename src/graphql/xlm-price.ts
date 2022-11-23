import { getAuthenticatedUser } from '../auth/logic';
import { getXlmInUsdDexPrice } from '../stellar/operations';

export const XLMPriceResolver = async (root: any, args: any, ctx: any) => {
  await getAuthenticatedUser(ctx);

  let { price } = await getXlmInUsdDexPrice();
  return price;
};
