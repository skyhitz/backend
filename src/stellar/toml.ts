import { getConfig } from './utils';
const TOML = require('@iarna/toml');

export function generateTomlFile({
  code,
  issuer,
  name,
  description,
  image,
  supply,
}): string {
  const assetInfo = {
    VERSION: '2.1.0',
    NETWORK_PASSPHRASE: getConfig().networkPassphrase,
    DOCUMENTATION: {
      ORG_NAME: 'Skyhitz',
      ORG_URL: 'https://skyhitz.io',
      ORG_LOGO: 'https://skyhitz.io/img/icon-512.png',
      ORG_DESCRIPTION: 'Music NFT Marketplace on Stellar and IPFS',
      ORG_TWITTER: 'Skyhitz',
    },
    CURRENCIES: [
      {
        code: code,
        issuer: issuer,
        name: name,
        desc: description,
        image: image,
        fixed_number: supply,
      },
    ],
  };
  return TOML.stringify(assetInfo);
}
