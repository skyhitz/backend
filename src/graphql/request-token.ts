import passwordless from '../passwordless/passwordless';
import { sendLoginEmail } from '../sendgrid/sendgrid';
import { getUserByEmail, getUserByPublicKey } from '../algolia/algolia';

export const requestTokenResolver = async (
  _: any,
  { usernameOrEmail, publicKey }: any,
  ctx: any
) => {
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

  console.log('current user', currentUser);

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
          await sendLoginEmail(currentUser, token);

          resolve(true);
        }
      }
    );
  });
};
