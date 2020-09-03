import express from 'express';
import bodyParser from 'body-parser';
import { Schema } from './schema';
import { Config } from '../config';
import jwt from 'express-jwt';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
const compression = require('compression');
import { webhooks } from '../webhooks';
import { corsOptions } from '../cors';
import { getAll } from '../redis';
let cors = require('cors');
const cache = require('memory-cache');
let cacheInstance = new cache.Cache();

const buildOptions: any = async (req: any) => {
  if (req.user) {
    // check cache instance
    let cachedUser = cacheInstance.get(req.user.id);
    if (cachedUser) {
      return {
        schema: Schema,
        context: {
          user: Promise.resolve(cachedUser),
        },
      };
    }
    return {
      schema: Schema,
      context: {
        user: getAll('users:' + req.user.id).then((user) => {
          if (!user) return null;
          if (req.user.version === parseInt(user.version)) {
            cacheInstance.put(req.user.id, user);
            return user;
          }
          return null;
        }),
      },
    };
  }
  return {
    schema: Schema,
    context: {
      user: Promise.resolve(null),
    },
  };
};

const setupGraphQLServer = () => {
  const graphQLServer = express();

  graphQLServer.use(
    '/api/graphql',
    bodyParser.json({
      verify: (req: any, res, buf) => {
        console.log('original url', req.originalUrl);
        if (req.originalUrl === '/api/stripe-webhooks') {
          req.rawBody = buf.toString();
        }
      },
    }),
    compression(),
    cors(corsOptions),
    jwt({
      secret: Config.JWT_SECRET,
      credentialsRequired: false,
    }),
    graphqlExpress(buildOptions)
  );

  webhooks(graphQLServer);

  graphQLServer.use(
    '/api/graphiql',
    graphiqlExpress({ endpointURL: '/api/graphql' })
  );
  return graphQLServer;
};

export const graphQLServer = setupGraphQLServer();

if (Config.ENV === 'development') {
  graphQLServer.listen(4000);
}
