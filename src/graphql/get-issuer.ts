import { getAuthenticatedUser } from '../auth/logic';
import { Keypair } from 'skyhitz-stellar-base';
import { Config } from '../config';
const shajs = require('sha.js');

export const getIssuerResolver = async (_: any, { cid }, ctx: any) => {
  await getAuthenticatedUser(ctx);

  const keypairSeed = shajs('sha256')
    .update(Config.ISSUER_SEED + cid)
    .digest();
  const issuerKey = Keypair.fromRawEd25519Seed(keypairSeed);
  return issuerKey.publicKey();
};
