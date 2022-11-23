import { GraphQLSchema, GraphQLObjectType } from 'graphql';
import RequestToken from './request-token';
import SignInWithToken from './sign-in-with-token';
import PaymentsInfo from './payments-info';
import UserLikes from './user-likes';
import EntryLikes from './entry-likes';
import AuthenticatedUser from './authenticated-user';
import { EntryById } from './entry';
import { UserEntries } from './user-entries';
import LikeEntry from './like-entry';
import CreateUserWithEmail from './create-user-with-email';
import BuyEntry from './buy-entry';
import CreateEntry from './create-entry';
import IndexEntry from './index-entry';
import UpdateUser from './update-user';
import RemoveEntry from './remove-entry';
import WithdrawToExternalWallet from './withdraw-to-external-wallet';
import UpdatePricing from './update-pricing';
import EntryPrice from './get-entry-price';
import XLMPrice from './xlm-price';
import GetIssuer from './get-issuer';
import SetLastPlayedEntry from './set-last-played-entry';
import SignInWithXDR from './sing-in-with-xdr';
import ChangeWallet from './change-wallet';
import GetAudibleToken from './get-audible-token';

const Query = new GraphQLObjectType({
  name: 'Query',
  description: 'Get users or entries',
  fields: () => {
    return {
      authenticatedUser: AuthenticatedUser,
      entryLikes: EntryLikes,
      entryPrice: EntryPrice,
      entry: EntryById,
      paymentsInfo: PaymentsInfo,
      userEntries: UserEntries,
      userLikes: UserLikes,
      xlmPrice: XLMPrice,
      getIssuer: GetIssuer,
      getAudibleToken: GetAudibleToken,
    };
  },
});

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Create users or entries',
  fields() {
    return {
      buyEntry: BuyEntry,
      changeWallet: ChangeWallet,
      createEntry: CreateEntry,
      createUserWithEmail: CreateUserWithEmail,
      indexEntry: IndexEntry,
      requestToken: RequestToken,
      signInWithToken: SignInWithToken,
      signInWithXDR: SignInWithXDR,
      likeEntry: LikeEntry,
      removeEntry: RemoveEntry,
      updateUser: UpdateUser,
      updatePricing: UpdatePricing,
      withdrawToExternalWallet: WithdrawToExternalWallet,
      setLastPlayedEntry: SetLastPlayedEntry,
    };
  },
});

export const Schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation,
});
