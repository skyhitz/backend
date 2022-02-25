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

  return JSON.stringify({
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
  });
};

export const decrypt = (hashString) => {
  const hash = JSON.parse(hashString);
  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(hash.iv, 'hex')
  );

  const decrpyted = Buffer.concat([
    decipher.update(Buffer.from(hash.content, 'hex')),
    decipher.final(),
  ]);

  return decrpyted.toString();
};
