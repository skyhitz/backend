import express from 'express';
import { Config } from '../config';
import { expressjwt as jwt } from 'express-jwt';
import { expressMiddleware } from '@apollo/server/express4';
const compression = require('compression');
import { TokenStore } from '../passwordless/store';
import passwordless from '../passwordless/passwordless';
import { getUser } from '../algolia/algolia';
import { assets } from '../assets/assets';
import { intiliazeCronJobs } from '../util/cron';
import { ApolloServer } from '@apollo/server';
import { resolvers } from './resolvers';
import cors from 'cors';
import cache from 'memory-cache';
import { User } from 'src/util/types';
import { Schema } from './schema';

let cacheInstance = new cache.Cache();

interface MyContext {
  user?: User;
}

const buildOptions: any = async (req: any) => {
  if (req.user) {
    // check cache instance
    let cachedUser = cacheInstance.get(req.user.id);
    if (cachedUser) {
      return {
        context: {
          user: Promise.resolve(cachedUser),
        },
      };
    }
    return {
      context: {
        user: getUser(req.user.id)
          .then((user: any) => {
            if (!user) return null;
            if (req.user.version === user.version) {
              cacheInstance.put(req.user.id, user);
              return user;
            }
            return null;
          })
          .catch((err: any) => {
            console.log(err);
            return null;
          }),
      },
    };
  }
  return {
    context: {
      user: Promise.resolve(null),
    },
  };
};

const graphqlUrl = '/api/graphql';

passwordless.init(new TokenStore());

const graphQLServer = express();

const startGraphqlServer = async () => {
  const server = new ApolloServer<MyContext>({
    typeDefs: Schema,
    resolvers,
  });

  await server.start();

  intiliazeCronJobs();

  graphQLServer.use(
    cors({
      origin: '*',
    })
  );

  graphQLServer.use(
    graphqlUrl,
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ): void => {
      const match = req.originalUrl.startsWith(graphqlUrl);
      if (!match) {
        next();
      } else {
        express.json()(req, res, next);
      }
    },
    compression(),
    jwt({
      algorithms: ['RS256'],
      secret: Config.JWT_SECRET,
      credentialsRequired: false,
    }),
    express.urlencoded({ extended: false }),
    expressMiddleware(server, buildOptions)
  );

  assets(graphQLServer);

  return graphQLServer;
};

startGraphqlServer();

export default graphQLServer;

if (Config.ENV === 'development') {
  graphQLServer.listen(4000);
}
