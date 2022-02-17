export type User = {
  avatarUrl: string;
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
  forSale: boolean;
  price: number;
  equityForSale: number;
  code: string;
  issuer: string;
  likeCount: number;
};

export type Issuer = {
  seed: string;
  objectID: string;
};
