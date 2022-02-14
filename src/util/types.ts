export type UserPayload = {
  avatarUrl: string;
  displayName: string;
  description: string;
  email: string;
  username: string;
  id: string;
  version: number;
  publishedAt: string;
  publishedAtTimestamp: number;
  publicKey: string;
  seed: string;
};

export type AlgoliaUserObject = {
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
