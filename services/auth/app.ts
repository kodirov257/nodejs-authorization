import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { ApolloServer, gql } from 'apollo-server-express';
import bodyParser from 'body-parser';
import express from 'express';
import http from 'http';
import path from 'path';
import cookieParser from 'cookie-parser';

import { indexRouter } from './routes';
import { graphqlRouter } from './routes/graphql';
import { usersRouter } from './routes/users';
import { resolvers } from './routes/auth';

import { typeDefs } from './typeDefs';

async function listen(port: number) {
  const app = express()
  app.use(bodyParser.json());
  // app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  app.use('/', indexRouter);
  app.use('/users', usersRouter);
  // app.use('/graphql', graphqlRouter);

  const httpServer = http.createServer(app)

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  })
  await server.start()

  server.applyMiddleware({ app, path: '/graphql' })

  return new Promise((resolve, reject) => {
    httpServer.listen(port).once('listening', resolve).once('error', reject)
  })
}

async function main() {
  try {
    await listen(4000)
    console.log('🚀 Server is ready at http://localhost:4000/graphql')
  } catch (err) {
    console.error('💀 Error starting the node server', err)
  }
}

void main()