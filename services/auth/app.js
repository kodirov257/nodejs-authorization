require('dotenv-flow').config();
import { ApolloServer } from 'apollo-server-express';
import { buildContext } from 'graphql-passport';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import express from 'express';
import fs from 'fs';

import { typeDefs as networkTypeDef } from './features/NetworkAuth/typeDefs';
import { typeDefs as verifyTypeDef } from './features/VerifyAuth/typeDefs';
import { typeDefs as basicTypeDef } from './features/BasicAuth/typeDefs';
import { NetworkAuth } from './features/NetworkAuth/resolvers';
import { VerifyAuth } from './features/VerifyAuth/resolvers';
import { BasicAuth } from './features/BasicAuth/resolvers';
import { COOKIE_SECRET } from './core/config';
import { log } from './core/services';
const indexRouter = require('./routes/index');
const jwkRouter = require('./routes/jwk');

const service = JSON.parse(fs.readFileSync('env.json', 'utf-8'));

const resolvers = () => {
  switch (service.service) {
    case 'NetworkAuth':
      return (new NetworkAuth()).resolvers();
    case 'VerifyAuth':
      return (new VerifyAuth()).resolvers();
    case 'BasicAuth':
      return (new BasicAuth()).resolvers();
    default:
      throw new Error('Wrong service.');
  }
};

const typeDef = () => {

  switch (service.service) {
    case 'NetworkAuth':
      return networkTypeDef;
    case 'VerifyAuth':
      return verifyTypeDef;
    case 'BasicAuth':
      return basicTypeDef;
    default:
      throw new Error('Wrong service.');
  }
};

const app = express();
async function runServer() {
  const server = new ApolloServer({
    typeDefs: typeDef(),
    resolvers: resolvers(),
    context: ({req, res}) => buildContext({req, res}),
    formatError: (error) => {
      console.log(error);
      log(error);
      return error;
    },
    formatResponse: (response) => {
      if ((has(response, 'errors') && response.errors) && has(response, 'data')) {
        delete response.data;
      }

      return response;
    },
    introspection: true,
  });

  app.use(bodyParser.json());
  app.use(cookieParser(COOKIE_SECRET));
  // app.use(require('express-session')({secret:'keyboard cat', resave: true, saveUninitialized: true}));
  app.use('/', indexRouter);
  app.use('/jwk', jwkRouter);

  switch (service.service) {
    case 'NetworkAuth':
      const networkRouter = require('./routes/network');
      app.use(networkRouter.passport.initialize());
      app.use('/network', networkRouter.router);
    case 'VerifyAuth':
      const userRouter = require('./routes/users');
      app.use('/users', userRouter);
    case 'BasicAuth':
      break;
    default:
      throw new Error('Wrong service.');
  }
  server.applyMiddleware({app});
}

runServer();

module.exports = app;
