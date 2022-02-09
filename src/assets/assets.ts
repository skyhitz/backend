import express from 'express';
import { AssetQueryModel } from './asset-query-model';
import { queryAssets } from './query-assets';

export function assets(graphQLServer) {
  graphQLServer.get(
    '/api/assets',
    express.raw({ type: 'application/json' }),
    async (request: express.Request, response: express.Response) => {
      const queryParams = new AssetQueryModel(request);
      // invoke query
      queryAssets(queryParams)
        // send response in JSON format
        .then((data) => response.json(data))
        .catch((err) => {
          // primitive error handling
          console.error(err);
          response.status(500).end();
        });
    }
  );
}
