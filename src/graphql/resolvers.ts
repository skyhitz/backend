import { requestTokenResolver } from './request-token';
import { signInWithTokenResolver } from './sign-in-with-token';
import { userCreditsResolver } from './user-credits';
import { userLikesResolver } from './user-likes';
import { entryLikesResolver } from './entry-likes';
import { authenticatedUserResolver } from './authenticated-user';
import { entryByIdResolver } from './entry';
import { userEntriesResolver } from './user-entries';
import { likeEntryResolver } from './like-entry';
import { createUserWithEmailResolver } from './create-user-with-email';
import { buyEntryResolver } from './buy-entry';
import { createEntryResolver } from './create-entry';
import { indexEntryResolver } from './index-entry';
import { updateUserResolver } from './update-user';
import { removeEntryResolver } from './remove-entry';
import { withdrawToExternalAddressResolver } from './withdraw-to-external-wallet';
import { updatePricingResolver } from './update-pricing';
import { entryPriceResolver } from './get-entry-price';
import { XLMPriceResolver } from './xlm-price';
import { getIssuerResolver } from './get-issuer';
import { setLastPlayedEntryResolver } from './set-last-played-entry';
import { signInWithXDRResolver } from './sing-in-with-xdr';
import { changeWalletResolver } from './change-wallet';
import { getAudibleTokenResolver } from './get-audible-token';
import { createBid } from './create-bid';
import { cancelBidResolver } from './cancel-bid';
import { hideBidResolver } from './hide-bid';
import { bids } from './bids';
import { acceptBidResolver } from './accept-bid';
import { pinAssetUrlResolver } from './pin-asset-url';
import { decentralizeEntryResolver } from './decentralize-entry';

const Query = {
  authenticatedUser: authenticatedUserResolver,
  bids: bids,
  entryLikes: entryLikesResolver,
  entryPrice: entryPriceResolver,
  entry: entryByIdResolver,
  userCredits: userCreditsResolver,
  userEntries: userEntriesResolver,
  userLikes: userLikesResolver,
  xlmPrice: XLMPriceResolver,
  getIssuer: getIssuerResolver,
  getAudibleToken: getAudibleTokenResolver,
};

const Mutation = {
  acceptBid: acceptBidResolver,
  buyEntry: buyEntryResolver,
  cancelBid: cancelBidResolver,
  changeWallet: changeWalletResolver,
  createBid: createBid,
  createEntry: createEntryResolver,
  createUserWithEmail: createUserWithEmailResolver,
  hideBid: hideBidResolver,
  indexEntry: indexEntryResolver,
  requestToken: requestTokenResolver,
  signInWithToken: signInWithTokenResolver,
  signInWithXDR: signInWithXDRResolver,
  likeEntry: likeEntryResolver,
  removeEntry: removeEntryResolver,
  updateUser: updateUserResolver,
  updatePricing: updatePricingResolver,
  withdrawToExternalWallet: withdrawToExternalAddressResolver,
  setLastPlayedEntry: setLastPlayedEntryResolver,
  pinAssetUrl: pinAssetUrlResolver,
  decentralizeEntry: decentralizeEntryResolver,
};

export const resolvers = {
  Query,
  Mutation,
};
