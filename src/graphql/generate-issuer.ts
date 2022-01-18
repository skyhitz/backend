import { GraphQLString } from 'graphql';
import { getAuthenticatedUser } from '../auth/logic';
import { Keypair } from 'skyhitz-stellar-base';
import { redisClient } from 'src/redis';

async function setIssuer(user, seed): Promise<boolean> {
  return new Promise((resolve, reject) => {
    redisClient
      .multi()
      .hmset(`issuer:${user.id}`, 'seed', seed)
      .exec(async (err) => {
        if (err) {
          console.log(err);
          return reject(false);
        }
        return resolve(true);
      });
  });
}

const generateIssuer = {
  type: GraphQLString,
  async resolve(_: any, args, ctx: any) {
    const user = await getAuthenticatedUser(ctx);

    const issuerKey = Keypair.random();
    const seed = issuerKey.secret();
    await setIssuer(user, seed);
    return issuerKey.publicKey();
  },
};

export default generateIssuer;
