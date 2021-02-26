import { GraphQLString, GraphQLNonNull } from 'graphql';
import User from './types/user';
import { smembers, getAll } from '../redis';

const passwordless = require('../passwordless/passwordless');

const SignIn = {
  type: User,
  args: {
    usernameOrEmail: {
      type: new GraphQLNonNull(GraphQLString),
    },
    password: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  async resolve(_: any, { usernameOrEmail, password }: any, ctx: any) {
    passwordless.requestToken(async function (user, delivery, callback) {
      let emailId = await smembers('emails:' + usernameOrEmail);

      let currentUser;
      if (emailId) {
        currentUser = await getAll('users:' + emailId);
      } else {
        throw 'Sorry, your username or email does not exist. Sign up to create an account.';
      }
      callback(null, currentUser ? currentUser.id : null);
    });
  },
};

export default SignIn;
