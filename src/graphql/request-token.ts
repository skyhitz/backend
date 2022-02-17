import { GraphQLBoolean, GraphQLString, GraphQLNonNull } from 'graphql';
import passwordless from '../passwordless/passwordless';
import { Config } from '../config';
import { sendGridService } from '../sendgrid/sendgrid';
import { getUserByEmail, getUserByPublicKey } from '../algolia/algolia';

const RequestToken = {
  type: GraphQLBoolean,
  args: {
    usernameOrEmail: {
      type: new GraphQLNonNull(GraphQLString),
    },
    publicKey: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  async resolve(_: any, { usernameOrEmail, publicKey }: any, ctx: any) {
    let currentUser;
    const errorMessage = `Sorry, your ${
      publicKey
        ? 'public key is not connected with any account.'
        : 'email does not exist.'
    } Sign up to create an account.`;
    try {
      if (publicKey) {
        currentUser = await getUserByPublicKey(publicKey);
      } else {
        currentUser = await getUserByEmail(usernameOrEmail);
      }
    } catch (e) {
      throw errorMessage;
    }
    if (!currentUser) {
      throw errorMessage;
    }

    let token = passwordless._generateToken()();
    let ttl = 60 * 60 * 1000;
    return new Promise((resolve, reject) => {
      passwordless._tokenStore.storeOrUpdate(
        token,
        currentUser.id,
        ttl,
        '',
        async function (storeError) {
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

            await sendGridService.sendEmail(msg);

            resolve(true);
          }
        }
      );
    });
  },
};

export default RequestToken;
