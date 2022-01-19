import express from 'express';
import { getAll } from './redis';
// const TOML = require('@iarna/toml');
// var tom = require('toml-js');

export function assets(graphQLServer) {
  graphQLServer.get(
    '/api/assets/:cid',
    express.raw({ type: 'application/toml' }),
    async (request: express.Request, response: express.Response) => {
      const cid = request.params.cid;
      const toml = await getAll(`toml:${cid}`);
      if (toml) {
        // console.log(JSON.parse(toml.toml));
        return response.send(toml.toml);
      }
      return response.send(404);
    }
  );
}
