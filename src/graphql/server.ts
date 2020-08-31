import * as Express from 'express';
import * as BodyParser from 'body-parser';
import { Schema } from './schema';
import { Config } from '../config';
import * as jwt from 'express-jwt';
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
  const graphQLServer = Express();

  graphQLServer.use(
    '/graphql',
    BodyParser.json({
      verify: (req: any, res, buf) => {
        var url = req.originalUrl;
        if (url.startsWith('/stripe-webhooks')) {
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

  if (Config.ENV !== 'development') {
    /**
     * We prepend /function-name the http trigger created is:
     * https://us-central1-skyhitz-161021.cloudfunctions.net/function-name/graphql
     * We take it out on development mode since we don't need it when running the server locally.
     */
    graphQLServer.use(
      '/graphiql',
      graphiqlExpress({ endpointURL: `${Config.API_ENDPOINT}/graphql` })
    );

    return graphQLServer;
  }
  graphQLServer.use('/graphiql', graphiqlExpress({ endpointURL: `/graphql` }));
  return graphQLServer;
};

const graphQLServer = setupGraphQLServer();

if (Config.ENV === 'development') {
  graphQLServer.listen(4000);
}

// export const graphql = onRequest(graphQLServer);
