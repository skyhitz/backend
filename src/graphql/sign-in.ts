import { GraphQLString, GraphQLNonNull } from 'graphql';
import User from './types/user';
import { validPassword } from '../auth/bycrypt';
import * as jwt from 'jsonwebtoken';
import { Config } from '../config';
import { smembers, getAll } from '../redis';

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
    let [[usernameId], [emailId]] = await Promise.all([
      smembers('usernames:' + usernameOrEmail),
      smembers('emails:' + usernameOrEmail),
    ]);
    let user;
    if (usernameId) {
      user = await getAll('users:' + usernameId);
    } else if (emailId) {
      user = await getAll('users:' + emailId);
    } else {
      throw 'Sorry, your username or email does not exist. Sign up to create an account.';
    }
    let valid = await validPassword(password, user.password);
    if (valid) {
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          version: parseInt(user.version),
        } as any,
        Config.JWT_SECRET
      );
      user.jwt = token;
      ctx.user = Promise.resolve(user);
      return user;
    }
    throw 'Incorrect password.';
  },
};

export default SignIn;
