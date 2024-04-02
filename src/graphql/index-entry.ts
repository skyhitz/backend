import { getAuthenticatedUser } from '../auth/logic';
import { getEntry, saveEntry } from '../algolia/algolia';
import { getAccountData } from '../stellar/operations';
import { Config } from '../config';
import axios from 'axios';
import {
  fallbackIpfsGateway,
  ipfsProtocol,
  pinataIpfsGateway,
} from '../constants/constants';
import { pinIpfsFile } from '../util/pinata';
import { GraphQLError } from 'graphql';
import { Keypair } from 'stellar-base';
import { updateMeta } from 'src/stellar';

const shajs = require('sha.js');

export const indexEntryResolver = async (
  _: any,
  { issuer, contract, tokenId, network, metaCid, fileCid }: any,
  ctx: any
) => {
  await getAuthenticatedUser(ctx);

  const { data, home_domain } = await getAccountData(issuer);

  const currentHomedomain = Config.APP_URL.replace('https://', '');

  if (home_domain !== currentHomedomain) {
    throw new GraphQLError(
      "Can't index NFTs from other marketplaces at the moment"
    );
  }

  const { ipfshash } = data;
  let decodedIpfshash = Buffer.from(ipfshash, 'base64').toString();

  if (metaCid !== decodedIpfshash && fileCid) {
    // update data on issuer
    const result = await updateMeta(metaCid, fileCid);
    if (result && result.submitted && result.success) {
      decodedIpfshash = metaCid;
    }
  }

  let response;

  response = await axios
    .get(`${pinataIpfsGateway}/${decodedIpfshash}`, {
      timeout: 15 * 1000,
    })
    .then(({ data }) => data)
    .catch((error) => {
      console.log(error);
      return null;
    });
  if (response === null) {
    console.log('Trying fallback gateway');
    response = await axios
      .get(`${fallbackIpfsGateway}/${decodedIpfshash}`, {
        timeout: 15 * 1000,
      })
      .then(({ data }) => data)
      .catch((error) => {
        console.log(error);
        return null;
      });
  }

  if (response === null) {
    throw new GraphQLError("Couldn't fetch the nft metadata from ipfs");
  }

  const {
    name,
    description,
    // code: metaCode,
    // issuer: metaIssuer,
    // domain,
    // supply,
    image,
    animation_url,
    // video,
  } = response;

  const video = animation_url;
  const metaCode = `${name}`
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ /g, '')
    .replace(/-/g, '')
    .replace(/[^0-9a-z]/gi, '')
    .slice(0, 12)
    .toUpperCase();

  const keypairSeed = shajs('sha256')
    .update(Config.ISSUER_SEED + video.replace(ipfsProtocol, ''))
    .digest();
  const issuerKey = Keypair.fromRawEd25519Seed(keypairSeed);

  const metaIssuer = issuerKey.publicKey();

  try {
    const pinningResults = await Promise.all([
      pinIpfsFile(image.replace(ipfsProtocol, ''), `${name}-image`),
      pinIpfsFile(video.replace(ipfsProtocol, ''), `${name}-video`),
    ]);

    // if (!pinningResults[0] || !pinningResults[1]) {
    //   throw new GraphQLError("Couldn't pin media to pinata");
    // }

    if (!pinningResults[1]) {
      throw new GraphQLError("Couldn't pin media to pinata");
    }
  } catch (ex) {
    throw new GraphQLError("Couldn't pin media to pinata");
  }

  console.log('Pinned media to pinata!');

  let entry;
  try {
    entry = await getEntry(decodedIpfshash);
  } catch {}

  const nameDivider = ' - ';
  const obj = {
    description,
    code: metaCode,
    issuer: metaIssuer,
    imageUrl: image,
    videoUrl: video,
    id: decodedIpfshash,
    objectID: decodedIpfshash,
    likeCount: entry?.likeCount ? entry.likeCount : 0,
    // title: name.substring(name.indexOf(nameDivider) + nameDivider.length)
    title: entry?.title ? entry.title : name,
    artist: entry?.artist
      ? entry.artist
      : name.substring(0, name.indexOf(nameDivider)),
    publishedAt: new Date().toISOString(),
    publishedAtTimestamp: Math.floor(new Date().getTime() / 1000),
    contract: contract ? contract : '',
    tokenId: tokenId ? tokenId : '',
    network: network ? network : '',
  };

  console.log('indexed entry:', obj);

  if (
    name &&
    description &&
    metaCode &&
    metaIssuer &&
    // domain &&
    // supply &&
    image &&
    animation_url &&
    video
  ) {
    try {
      await saveEntry(obj);
      return obj;
    } catch (ex) {
      throw new GraphQLError("Couldn't index entry.");
    }
  }
  throw new GraphQLError('Invalid entry metadata');
};
