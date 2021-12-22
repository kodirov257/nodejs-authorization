import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { ApolloServer } from 'apollo-server-express';
import { IResolvers } from '@graphql-tools/utils';
import { buildContext } from 'graphql-passport';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import passport from 'passport';
import express from 'express';
import http from 'http';

import { BasicAuth } from './features/BasicAuth/resolvers';
import { usersRouter } from './routes/users';
import { indexRouter } from './routes';

import { ContextModel } from './core/models';
import { typeDefs } from './typeDefs';
import envJson from './env.json';

const { service }: { service: string } = envJson;
dotenv.config();

const resolvers = (): IResolvers => {
  switch (service) {
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
    context: ({ req, res }: ContextModel) => buildContext({ req, res })
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