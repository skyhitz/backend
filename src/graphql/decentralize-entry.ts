import axios from 'axios';
import { Config } from 'src/config';
import { pinAssetUrl, pinIpfsFile, pinJSON } from 'src/util/pinata';

const ipfsUrl = 'https://ipfs.io/ipfs';

export const pinExternalUrl = async (initial_url: string) => {
  let url = '';
  if (initial_url.includes('ar://')) {
    url = initial_url.replace('ar://', 'https://arweave.net/');
  }

  const final_url = url ? url : initial_url;
  const res = await axios.head(final_url);

  if (res.status === 200) {
    // pin the url of the asset
    const { IpfsHash } = await pinAssetUrl(final_url);

    if (IpfsHash) {
      return IpfsHash;
    }
  }

  return null;
};

export const findAndPinIpfsHash = async (parts: string[]) => {
  var ipfsHash = parts.pop() || parts.pop();

  const res = await axios.head(`${ipfsUrl}/${ipfsHash}`);

  if (res.status === 200) {
    // pin it to our server
    await pinIpfsFile(ipfsHash, ipfsHash);
    return ipfsHash;
  }
};

export const getIpfsHashForMedia = async (media: string) => {
  var parts = media.split('/');

  if (parts[parts.length - 2].includes('ipfs') || parts[0].includes('ipfs:')) {
    return await findAndPinIpfsHash(parts);
  } else if (media) {
    const IpfsHash = await pinExternalUrl(media);

    if (IpfsHash) {
      return IpfsHash;
    }
  }
};

const ipfsProtocolUrl = (hash: string) => {
  return `ipfs://${hash}`;
};

export const decentralizeEntryResolver = async (
  _: any,
  { contract, tokenId, network }: any
) => {
  const networks = {
    ethereum: 'eth-mainnet',
    polygon: 'polygon-mainnet',
    solana: 'solana-mainnet',
  };

  const alchemyUrl = `https://${networks[network]}.g.alchemy.com/nft/v3/${Config.ALCHEMY_API_KEY}/getNFTMetadata?contractAddress=${contract}&tokenId=${tokenId}&refreshCache=false`;

  const { data } = await axios.get(alchemyUrl);

  const tokenUri = data.tokenUri;

  let ipfsHashes = {
    media: '',
    metadata: '',
    contract,
    tokenId,
    network,
  };

  let { data: metadata } = await axios.get(tokenUri);

  const imageHash = await getIpfsHashForMedia(metadata.image);
  const animationHash = await getIpfsHashForMedia(metadata.animation_url);

  metadata.image = ipfsProtocolUrl(imageHash);
  metadata.animation_url = ipfsProtocolUrl(animationHash);
  metadata.neworks = {};
  metadata.networks[network] = { [contract]: [tokenId] };

  ipfsHashes.metadata = await pinJSON(metadata);
  ipfsHashes.media = animationHash;

  return ipfsHashes;
};

// const { CHAIN, CONTRACT_ADDRESS, TOKEN_ID } = input.config();

// const payload =  {
//                 "query": "mutation decentralizeEntry($contract: String!, $tokenId: String!, $network: String!) { decentralizeEntry(contract: $contract, tokenId: $tokenId, network: $network) { media, metadata }}",
//                 "variables": {  "contract": CONTRACT_ADDRESS, "tokenId": TOKEN_ID, "network": CHAIN }
//             }
//             // send the url of the asset to pin it on our server
// const res = await fetch('https://api.skyhitz.io/api/graphql', {
//                     method: 'POST',
//                     headers: {
//                     'Content-Type': 'application/json',
//                     'Accept': 'application/json',
//                     },
//                     body: JSON.stringify(payload)
//                 });

// const final = await res.json();

// output.set('res', final)
