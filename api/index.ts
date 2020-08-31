import { NowRequest, NowResponse } from '@vercel/node';
import { graphQLServer } from './graphql/server';

export default (req: NowRequest, res: NowResponse) => {
  return graphQLServer(req, res);
};
