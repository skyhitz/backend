import { GraphQLString, GraphQLNonNull } from 'graphql';

import * as jwt from 'jsonwebtoken';
import User from './types/user';
import { Config } from '../config';
import { sendGridService } from '../sendgrid/sendgrid';
import { generateHash } from '../auth/bycrypt';
import { smembers, getAll, updateUser } from '../redis';

const updatePassword = {
  type: User,
  args: {
    email: {
      type: new GraphQLNonNull(GraphQLString),
    },
    token: {
      type: new GraphQLNonNull(GraphQLString),
    },
    password: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  async resolve(_: any, args: any, ctx: any) {
    let [userId] = await smembers('emails:' + args.email);
    let user;
    if (userId) {
      user = await getAll('users:' + userId);
      if (!user) {
        throw 'Password reset token is invalid or has expired.';
      }
      if (user.resetPasswordToken !== args.resetPasswordToken) {
        throw 'Password reset token is invalid.';
      }
      if (parseInt(user.resetPasswordExpires) > Date.now()) {
        throw 'Password reset token has expired.';
      }
    } else {
      throw 'Password reset token is invalid or has expired.';
    }

    let passwordHash = await generateHash(args.password);
    user.password = passwordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.version = user.version + 1;
    await updateUser(user);

    const msg = {
      to: user.email,
      from: 'alejandro@skyhitzmusic.com',
      subject: 'Your password has been changed',
      html: `<p>Hi ${user.displayName}, <br><br>This is a confirmation that the password for your Skyhitz account ${user.email} has just been changed.</p>`,
    };
    sendGridService.sendEmail(msg);

    const { id, email, version } = user;
    const token = jwt.sign({ id, email, version } as any, Config.JWT_SECRET);
    user.jwt = token;
    ctx.user = Promise.resolve(user);
    return user;
  },
};

export default updatePassword;
