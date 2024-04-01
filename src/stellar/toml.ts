import { getConfig } from './utils';
import { pinataGateway } from '../constants/constants';
const TOML = require('@iarna/toml');

export function generateTomlFile({
  code,
  issuer,
  name,
  description,
  image,
  supply,
}): string {
  const finalImage = image.includes('ipfs://')
    ? `${pinataGateway}/ipfs/${image.replace('ipfs://', '')}`
    : image;

  const assetInfo = {
    VERSION: '2.1.0',
    NETWORK_PASSPHRASE: getConfig().networkPassphrase,
    DOCUMENTATION: {
      ORG_NAME: 'Skyhitz',
      ORG_URL: 'https://skyhitz.io',
      ORG_LOGO: 'https://skyhitz.io/img/icon-128.png',
      ORG_DESCRIPTION: 'Music NFTs on Stellar and IPFS',
      ORG_TWITTER: 'Skyhitz',
    },
    CURRENCIES: [
      {
        code: code,
        issuer: issuer,
        name: name,
        desc: description,
        image: `${finalImage}?img-width=200&img-height=200`,
        fixed_number: supply,
      },
    ],
  };
  return TOML.stringify(assetInfo);
}
