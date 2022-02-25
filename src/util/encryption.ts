import { Config } from '../config';

const crypto = require('crypto');
const algorithm = 'aes-256-ctr';
const secretKey = crypto
  .createHash('sha256')
  .update(String(Config.ISSUER_SEED))
  .digest('base64')
  .substr(0, 32);
const iv = crypto.randomBytes(16);

export const encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return `iv${iv.toString('hex')}content${encrypted.toString('hex')}`;
};

export const decrypt = (combination) => {
  const keyword = 'content';
  const hashIv = combination.substring(2, combination.indexOf(keyword));
  const hashContent = combination.substring(
    combination.indexOf(keyword) + keyword.length,
    combination.length
  );
  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(hashIv, 'hex')
  );

  const decrpyted = Buffer.concat([
    decipher.update(Buffer.from(hashContent, 'hex')),
    decipher.final(),
  ]);

  return decrpyted.toString();
};
