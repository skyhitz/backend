import express from 'express';
import { Schema } from './schema';
import { Config } from '../config';
import jwt from 'express-jwt';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
const compression = require('compression');
const RedisStore = require('../passwordless/store');
import passwordless from '../passwordless/passwordless';
import { stripeWebhook } from '../webhooks';
import { getAll } from '../redis';
import { assets } from '../assets';

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

const graphiqlUrl = '/api/graphiql';
const graphqlUrl = '/api/graphql';
const graphEndpoints = [graphiqlUrl, graphqlUrl];

passwordless.init(new RedisStore());

const setupGraphQLServer = () => {
  const graphQLServer = express();

  graphQLServer.options('*', cors());
  graphQLServer.use(cors());

  graphQLServer.use(
    graphqlUrl,
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ): void => {
      const match = graphEndpoints.find((endpoint) =>
        req.originalUrl.startsWith(endpoint)
      );
      if (!match) {
        next();
      } else {
        express.json()(req, res, next);
      }
    },
    compression(),
    jwt({
      secret: Config.JWT_SECRET,
      credentialsRequired: false,
    }),
    express.urlencoded({ extended: false }),
    graphqlExpress(buildOptions)
  );

  assets(graphQLServer);

  stripeWebhook(graphQLServer);

  graphQLServer.use(graphiqlUrl, graphiqlExpress({ endpointURL: graphqlUrl }));
  return graphQLServer;
};

export const graphQLServer = setupGraphQLServer();

if (Config.ENV === 'development') {
  graphQLServer.listen(4000);
}
