import {ApolloServerPluginDrainHttpServer, GraphQLResponse} from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import { IResolvers } from '@graphql-tools/utils';
import { buildContext } from 'graphql-passport';
import cookieParser from 'cookie-parser';
import { GraphQLError } from 'graphql';
import bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import passport from 'passport';
import express from 'express';
import http from 'http';
import lodash from 'lodash';

import { VerifyAuth } from './features/VerifyAuth/resolvers';
import { BasicAuth } from './features/BasicAuth/resolvers';
import { usersRouter } from './routes/users';

import { ContextModel } from './core/models';
import { LogService } from './core/services';
import { indexRouter } from './routes';
import { typeDefs } from './typeDefs';
import envJson from './env.json';

const { service }: { service: string } = envJson;
dotenv.config();

const { has } = lodash;

const resolvers = (): IResolvers => {
  switch (service) {
    case 'VerifyAuth':
      return (new VerifyAuth()).resolvers();
    case 'BasicAuth':
      return (new BasicAuth()).resolvers();
    default:
      throw new Error('Wrong service.');
  }
}

async function listen(port: number) {
  const app = express()
  app.use(bodyParser.json());
  // app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(passport.initialize());

  app.use('/', indexRouter);
  app.use('/users', usersRouter);

  const httpServer = http.createServer(app)

  const server = new ApolloServer({
    typeDefs,
    resolvers: resolvers(),
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    context: ({ req, res }: ContextModel) => buildContext({ req, res }),
    formatError: (error: GraphQLError) => {
      const logService: LogService = new LogService();
      logService.log(error);

      if (process.env.NODE_ENV === 'development') {
        return {
          message: error.message,
          ...(error.locations && {locations: error.locations}),
          ...(error.path && {path: error.path}),
          extensions: error.extensions,
        };
      }

      return {
        message: error.message,
        ...(error.path && {path: error.path}),
      };
    },
    // formatResponse: (response: GraphQLResponse) => {
    //   console.log(response);
    //   if ((has(response, 'errors') && response.errors) && has(response, 'data')) {
    //     delete response.data;
    //   }
    //   console.log(response);
    //
    //   return response;
    // },
    introspection: true,
  })
  await server.start()

  server.applyMiddleware({ app, path: '/graphql' })

  return new Promise((resolve, reject) => {
    httpServer.listen(port).once('listening', resolve).once('error', reject)
  })
}

async function main() {
  try {
    await listen(4000);
    console.log('🚀 Server is ready at http://localhost:4000/graphql');
  } catch (err) {
    console.error('💀 Error starting the node server', err);
  }
}

void main();