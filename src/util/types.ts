export type User = {
  avatarUrl: string;
  backgroundUrl: string;
  displayName: string;
  description: string;
  email: string;
  username: string;
  id: string;
  publishedAt: string;
  publishedAtTimestamp: number;
  objectID: string;
  publicKey: string;
  seed: string;
  version: number;
  jwt?: string;
  lastPlayedEntry?: Entry;
  twitter: string;
  instagram: string;
};

export type Entry = {
  id: string;
  imageUrl: string;
  description: string;
  title: string;
  artist: string;
  videoUrl: string;
  publishedAt: string;
  publishedAtTimestamp: number;
  code: string;
  issuer: string;
  likeCount: number;
  objectID: string;
};

export type HiddenBid = {
  id: string;
  hiddenBy: string[];
};

export type EmbeddedOffer = {
  _embedded: { records: Offer[] };
};

export type Offer = {
  id: string;
  seller: string;
  selling:
    | {
        asset_type: 'native';
      }
    | {
        asset_type: 'credit_alphanum12' | 'credit_alphanum4';
        asset_code: string;
        asset_issuer: string;
      };
  buying:
    | {
        asset_type: 'native';
      }
    | {
        asset_type: 'credit_alphanum12' | 'credit_alphanum4';
        asset_code: string;
        asset_issuer: string;
      };
  // The amount of selling that the account making this offer is willing to sell.
  amount: string;
  // How many units of buying it takes to get 1 unit of selling. A number representing the decimal form of price_r.
  price: string;
};
