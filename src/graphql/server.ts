import express from 'express';
import { Config } from '../config';
import { expressjwt as jwt } from 'express-jwt';
import { expressMiddleware } from '@apollo/server/express4';
const compression = require('compression');
import { TokenStore } from '../passwordless/store';
import passwordless from '../passwordless/passwordless';
import { getUser } from '../algolia/algolia';
import { assets } from '../assets/assets';
import { ApolloServer } from '@apollo/server';
import { resolvers } from './resolvers';
import cors from 'cors';
import cache from 'memory-cache';
import { User } from '../util/types';
import { Schema } from './schema';

const cacheInstance = new cache.Cache();
const graphqlUrl = '/api/graphql';

interface MyContext {
  user?: User;
}

const createContext = async ({ req }) => {
  if (req.user) {
    // check cache instance
    const cachedUser = cacheInstance.get(req.user.id);
    if (cachedUser) {
      return {
        user: Promise.resolve(cachedUser),
      };
    }
    return {
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
    };
  }
  return {
    user: Promise.resolve(null),
  };
};

const checkPath = (
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
};

passwordless.init(new TokenStore());

const graphQLServer = express();

const startGraphqlServer = async () => {
  const server = new ApolloServer<MyContext>({
    typeDefs: Schema,
    resolvers,
  });

  await server.start();

  graphQLServer.use(
    cors({
      origin: '*',
    })
  );

  graphQLServer.use(
    graphqlUrl,
    checkPath,
    cors({
      origin: '*',
    }),
    compression(),
    jwt({
      algorithms: ['HS256'],
      secret: Config.JWT_SECRET,
      credentialsRequired: false,
      requestProperty: 'user',
    }),
    express.urlencoded({ extended: false }),
    expressMiddleware(server, { context: createContext })
  );

  assets(graphQLServer);

  return graphQLServer;
};

startGraphqlServer();

export default graphQLServer;

if (Config.ENV === 'development') {
  graphQLServer.listen(4000);
}
