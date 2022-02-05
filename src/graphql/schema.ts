import { GraphQLSchema, GraphQLObjectType } from 'graphql';
import RequestToken from './request-token';
import SignIn from './sign-in';
import PaymentsInfo from './payments-info';
import UserLikes from './user-likes';
import EntryLikes from './entry-likes';
import AuthenticatedUser from './authenticated-user';
import Entries from './entries';
import TopChart from './top-chart';
import RecentlyActive from './recently-active';
import RecentlyAdded from './recently-added';
import LikeEntry from './like-entry';
import CreateUserWithEmail from './create-user-with-email';
import BuyCredits from './buy-credits';
import BuyEntry from './buy-entry';
import SubscribeUser from './subscribe-user';
import CancelSubscription from './cancel-subscription';
import CreateEntry from './create-entry';
import UpdateUser from './update-user';
import RemoveEntry from './remove-entry';
import WithdrawToExternalWallet from './withdraw-to-external-wallet';
import UpdatePricing from './update-pricing';
import EntryPrice from './get-entry-price';
import GenerateIssuer from './generate-issuer';
import XLMPrice from './xlm-price';

const Query = new GraphQLObjectType({
  name: 'Query',
  description: 'Get users or entries',
  fields: () => {
    return {
      authenticatedUser: AuthenticatedUser,
      entryLikes: EntryLikes,
      entryPrice: EntryPrice,
      entries: Entries,
      paymentsInfo: PaymentsInfo,
      recentlyActive: RecentlyActive,
      recentlyAdded: RecentlyAdded,
      topChart: TopChart,
      userLikes: UserLikes,
      xlmPrice: XLMPrice,
    };
  },
});

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Create users or entries',
  fields() {
    return {
      buyEntry: BuyEntry,
      buyCredits: BuyCredits,
      createEntry: CreateEntry,
      createUserWithEmail: CreateUserWithEmail,
      requestToken: RequestToken,
      generateIssuer: GenerateIssuer,
      signIn: SignIn,
      likeEntry: LikeEntry,
      removeEntry: RemoveEntry,
      cancelSubscription: CancelSubscription,
      subscribeUser: SubscribeUser,
      updateUser: UpdateUser,
      updatePricing: UpdatePricing,
      withdrawToExternalWallet: WithdrawToExternalWallet,
    };
  },
});

export const Schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation,
});
