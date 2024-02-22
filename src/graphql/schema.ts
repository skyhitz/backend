export const Schema = `
type Query {
  authenticatedUser: User!
  bids(assetCode: String!, assetIssuer: String!): [Offer!]!
  entryLikes(id: String!): EntryLikes!
  entryPrice(id: String!): EntryPrice!
  entry(id: String!): EntryDetails!
  userCredits: Float!
  userEntries(userId: String!): [Entry!]!
  userLikes: [Entry!]!
  xlmPrice: String!
  getIssuer(cid: String!): String!
  getAudibleToken: Token!
}

type Mutation {
  acceptBid(id: String!): ConditionalXDR!
  buyEntry(id: String!, amount: Float!, price: Float!): ConditionalXDR!
  cancelBid(id: String): ConditionalXDR!,
  changeWallet(signedXDR: String!): User!
  createBid(
    id: String!
    price: Int!
    equityToBuy: Float!
  ): ConditionalXDR!,
  createEntry(
    fileCid: String!
    metaCid: String!
    code: String!
    forSale: Boolean!
    price: Int!
    equityForSale: Float!
    globalMint: Boolean!
  ): ConditionalXDR!
  createUserWithEmail(
    displayName: String!
    email: String!
    username: String!
    signedXDR: String
  ): ConditionalUser!
  hideBid(id: String!): Boolean!
  indexEntry(issuer: String!): Entry!
  decentralizeEntry(
    contract: String!
    tokenId: String!
    network: String!
  ): Entry!
  requestToken(usernameOrEmail: String!): Boolean!
  signInWithToken(token: String!, uid: String!): User!
  signInWithXDR(signedXDR: String!): User!
  likeEntry(id: String!, like: Boolean!): Boolean!
  removeEntry(id: String!): Boolean!
  updateUser(
    avatarUrl: String
    backgroundUrl: String
    displayName: String
    description: String
    username: String
    email: String
    twitter: String
    instagram: String
  ): User!
  updatePricing(
    id: String!
    price: Int!
    forSale: Boolean!
    equityForSale: Float!
    offerID: String!
  ): ConditionalXDR!
  withdrawToExternalWallet(address: String!, amount: Int!): Boolean!
  setLastPlayedEntry(entryId: String!): Boolean!
  pinAssetUrl(url: String!): IpfsRes!
}

type decentralizeMetaRes {
  media: String!
  metadata: String!
}

type IpfsRes {
  IpfsHash: String!
  PinSize: Int!
  Timestamp: String!
}

type User {
  avatarUrl: String!
  backgroundUrl: String
  displayName: String
  email: String!
  username: String!
  id: String!
  publishedAt: String
  version: Int
  jwt: String
  description: String
  publicKey: String!
  lastPlayedEntry: Entry
  managed: Boolean!
  twitter: String
  instagram: String
}

type Entry {
  imageUrl: String!
  videoUrl: String!
  description: String
  title: String!
  id: String!
  artist: String!
  code: String!
  issuer: String!
}

type EntryLikes {
  count: Int!
  users: [PublicUser]
}

type PublicUser {
  avatarUrl: String!
  displayName: String
  username: String!
  id: String!
  description: String
}

type EntryPrice {
  price: String!
  amount: String!
}

type EntryDetails {
  imageUrl: String!
  videoUrl: String!
  description: String
  title: String!
  id: String!
  artist: String!
  code: String!
  issuer: String!
  holders: [EntryHolder!]
  history: [EntryActivity!]
}

type EntryHolder {
  account: String!
  balance: String!
}

type EntryActivity {
  id: String!
  type: Int!
  ts: Int!
  accounts: [String]
  assets: [String]
  tx: String!
  offer: String
  createdOffer: String
  amount: String
  sourceAmount: String
  price: ActivityPrice
}

type ActivityPrice {
  n: Int!
  d: Int!
}

type Token {
  token: String!
}

type ConditionalXDR {
  xdr: String
  success: Boolean!
  submitted: Boolean!
  message: String
  exists: Boolean
  publicKey: String!
}

type ConditionalUser {
  user: User
  message: String!
}

type AccountCredits {
  credits: Float!
}

type Offer {
  id: String!
  seller: String!
  selling: Asset!
  buying: Asset!
  amount: String!
  price: String!
}

type Asset {
  asset_type: String!
  asset_code: String
  asset_issuer: String
}
`;
