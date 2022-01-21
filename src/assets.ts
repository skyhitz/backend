import express from 'express';
import { getAll } from './redis';

export function assets(graphQLServer) {
  graphQLServer.get(
    '/id/:cid/.well-known/stellar.toml',
    express.raw({ type: 'text/plain' }),
    async (request: express.Request, response: express.Response) => {
      const cid = request.params.cid;
      const toml = await getAll(`toml:${cid}`);
      if (toml) {
        return response.send(toml.toml);
      }
      return response.send(404);
    }
  );
}
