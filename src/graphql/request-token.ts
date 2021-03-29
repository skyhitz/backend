import { GraphQLBoolean, GraphQLString, GraphQLNonNull } from 'graphql';
import { smembers, getAll } from '../redis';
import passwordless from '../passwordless/passwordless';
import { Config } from '../config';
import { sendGridService } from '../sendgrid/sendgrid';

const RequestToken = {
  type: GraphQLBoolean,
  args: {
    usernameOrEmail: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  async resolve(_: any, { usernameOrEmail }: any, ctx: any) {
    let emailId = await smembers('emails:' + usernameOrEmail);
    let currentUser;
    if (emailId) {
      try {
        currentUser = await getAll('users:' + emailId);
      } catch (e) {
        throw 'Sorry, your email does not exist. Sign up to create an account.';
      }
    }

    if (!currentUser) {
      throw 'Sorry, your email does not exist. Sign up to create an account.';
    }

    let token = passwordless._generateToken()();
    let ttl = 60 * 60 * 1000;
    return new Promise((resolve, reject) => {
      passwordless._tokenStore.storeOrUpdate(
        token,
        currentUser.id,
        ttl,
        '',
        function (storeError) {
          if (storeError) {
            throw `Error on the storage layer: ${storeError}`;
          } else {
            const msg = {
              to: currentUser.email,
              from: 'alejandro@skyhitzmusic.com',
              subject: 'Skyhitz Login Link',
              html: `<p>Hi,
        <br><p>You are receiving this email because you have requested access to your Skyhitz account.<br>
        Please click this link to complete the process:<br><br>
        <strong><a clicktracking=off href="${
          Config.APP_URL
        }/accounts/sign-in?token=${token}&uid=${encodeURIComponent(
                currentUser.id
              )}">Sign In Here</a></strong>
        <br><br>If you did not request this, please ignore this email and let us know if your account was compromised.
        <br><br>Keep making music, <br>Skyhitz Team</p>`,
            };
            console.log('trigger email send');
            sendGridService.sendEmail(msg);
            resolve(true);
          }
        }
      );
    });
  },
};

export default RequestToken;
