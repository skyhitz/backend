import { VercelRequest, VercelResponse } from '@vercel/node';
import { graphQLServer } from '../src/graphql/server';

export default (req: VercelRequest, res: VercelResponse) => {
  return graphQLServer(req, res);
};
