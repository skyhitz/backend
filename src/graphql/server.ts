import express from 'express';
import bodyParser from 'body-parser';
import { Schema } from './schema';
import { Config } from '../config';
import jwt from 'express-jwt';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
const compression = require('compression');
const session = require('express-session');
const RedisStore = require('../passwordless/store');

import passwordless from '../passwordless/passwordless';

import { stripeWebhook } from '../webhooks';
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

passwordless.init(new RedisStore());
passwordless.addDelivery(function (
  tokenToSend,
  uidToSend,
  recipient,
  callback
) {
  console.log('recipient', recipient);
  console.log(
    'Access the account here:\n' +
      'http://localhost:3000/' +
      '?token=' +
      tokenToSend +
      '&uid=' +
      encodeURIComponent(uidToSend)
  );
  callback();
});

const setupGraphQLServer = () => {
  const graphQLServer = express();

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
    cors(corsOptions),
    jwt({
      secret: Config.JWT_SECRET,
      credentialsRequired: false,
    }),
    session({ secret: 'foo', resave: false, saveUninitialized: true }),
    bodyParser.urlencoded({ extended: false }),
    passwordless.sessionSupport() as any,
    passwordless.acceptToken() as any,
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
