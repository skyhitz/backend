import express from 'express';
import bodyParser from 'body-parser';
import { Schema } from './schema';
import { Config } from '../config';
import jwt from 'express-jwt';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { graphqlUploadExpress } from 'graphql-upload';
const compression = require('compression');
const RedisStore = require('../passwordless/store');

import passwordless from '../passwordless/passwordless';
import { stripeWebhook } from '../webhooks';
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

passwordless.init(new RedisStore());

const setupGraphQLServer = () => {
  const graphQLServer = express();

  graphQLServer.options('*', cors());
  graphQLServer.use(cors());

  graphQLServer.use(
    '/api/graphql',
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ): void => {
      if (req.originalUrl === '/api/stripe-webhooks') {
        next();
      } else {
        bodyParser.json()(req, res, next);
      }
    },
    compression(),
    jwt({
      secret: Config.JWT_SECRET,
      credentialsRequired: false,
    }),
    bodyParser.urlencoded({ extended: false }),
    graphqlUploadExpress({ maxFileSize: 100000000, maxFiles: 2 }),
    graphqlExpress(buildOptions)
  );

  stripeWebhook(graphQLServer);

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
