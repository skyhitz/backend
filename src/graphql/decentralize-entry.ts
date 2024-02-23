import axios from 'axios';
import { Config } from 'src/config';
import { pinAssetUrl } from 'src/util/pinata';

function isOnIpfs(url: string) {
  // This regex checks for URLs where 'ipfs' appears right before the hash
  // and does not enforce any segments after the hash
  const regex = /^(https?:\/\/)?.+\/ipfs\/[a-zA-Z0-9]+\/?$/;

  return regex.test(url);
}

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

  const ipfsUrl = 'https://ipfs.io/ipfs';

  let ipfsHashes = {
    media: '',
    metadata: '',
  };

  // strip the ipfs hash and check if it loads on other ipfs nodes

  if (isOnIpfs(tokenUri)) {
    console.log('decentralized meta');
    var parts = tokenUri.split('/');
    var metadataIpfsHash = parts.pop() || parts.pop();

    // @ts-ignore
    const { data: metadata } = await axios.get(
      `${ipfsUrl}/${metadataIpfsHash}`
    );

    // strip the ipfs hash and check if it loads on other ipfs nodes

    if (metadata && metadata.animation_url.includes('ipfs')) {
      var parts = metadata.animation_url.split('/');
      var ipfsHash = parts.pop() || parts.pop();

      // @ts-ignore
      const res = await axios.head(`${ipfsUrl}/${ipfsHash}`);

      // decentralized media metadata
      if (res.status === 200) {
        ipfsHashes.media = ipfsHash;
      }
    } else if (metadata && metadata.animation_url) {
      const res = await axios.head(metadata.animation_url);

      if (res.status === 200) {
        // pin the url of the asset
        const { IpfsHash } = await pinAssetUrl(metadata.animation_url);

        if (IpfsHash) {
          ipfsHashes.media = IpfsHash;
        }
      }
    }

    ipfsHashes.metadata = metadataIpfsHash;
  } else {
    console.log('centralized');

    // @ts-ignore
    let { data: centralizedMeta } = await axios.get(tokenUri);

    // strip the ipfs hash and check if it loads on other ipfs nodes

    if (centralizedMeta && centralizedMeta.animation_url.includes('ipfs')) {
      var parts = centralizedMeta.animation_url.split('/');
      var ipfsHash = parts.pop() || parts.pop();
      const res = await axios.head(`${ipfsUrl}/${ipfsHash}`);

      if (res.status === 200) {
        // pin the hash of the asset

        const body = {
          hashToPin: ipfsHash,
        };

        const final = await axios.post(
          'https://api.pinata.cloud/pinning/pinByHash',
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${Config.PINATA_JWT}`,
            },
            body: JSON.stringify(body),
          }
        );

        if (final) {
          ipfsHashes.media = ipfsHash;
        }
      }
    } else if (centralizedMeta && centralizedMeta.animation_url) {
      const res = await axios.head(centralizedMeta.animation_url);

      if (res.status === 200) {
        // pin the url of the asset
        const { IpfsHash } = await pinAssetUrl(centralizedMeta.animation_url);
        if (IpfsHash) {
          ipfsHashes.media = IpfsHash;
        }
      }
    }

    centralizedMeta.animation_url = `ipfs://${ipfsHashes.media}`;

    const body = {
      pinataContent: centralizedMeta,
      pinataOptions: { cidVersion: 1 },
    };

    const { data: jsonPinRes } = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      body,
      {
        headers: { Authorization: `Bearer ${Config.PINATA_JWT}` },
      }
    );

    if (jsonPinRes) {
      ipfsHashes.metadata = jsonPinRes.IpfsHash;
    }
  }

  return ipfsHashes;
};

// @ts-ignore
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
