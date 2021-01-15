require('dotenv-flow').config();
import { ApolloServer } from 'apollo-server-express';
import { buildContext } from 'graphql-passport';
import bodyParser from 'body-parser';
import { log } from './core/services';
import express from 'express';
import fs from 'fs';

import { typeDefs as networkTypeDef } from './features/NetworkAuth/typeDefs';
import { typeDefs as verifyTypeDef } from './features/VerifyAuth/typeDefs';
import { typeDefs as basicTypeDef } from './features/BasicAuth/typeDefs';
import { NetworkAuth } from './features/NetworkAuth/resolvers';
import { VerifyAuth } from './features/VerifyAuth/resolvers';
import { BasicAuth } from './features/BasicAuth/resolvers';
const indexRouter = require('./routes/index');

const service = JSON.parse(fs.readFileSync('service.json', 'utf-8'));

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

const server = new ApolloServer({
  typeDefs: typeDef(),
  resolvers: resolvers(),
  context: ({req, res}) => buildContext({req, res}),
  formatError: (error) => {
    console.log(error);
    log(error);
    throw error;
  },
});


const app = express();
app.use(bodyParser.json())
app.use('/', indexRouter);

switch (service.service) {
  case 'NetworkAuth':
    const networkRouter = require('./routes/network');
    app.use(networkRouter.passport.initialize());
    app.use('/network', networkRouter.router);
  case 'VerifyAuth':
    const userRouter = require('./routes/users');
    const authRouter = require('./routes/auth');
    app.use('/auth', authRouter);
    app.use('/users', userRouter);
  case 'BasicAuth':
    break;
  default:
    throw new Error('Wrong service.');
}
server.applyMiddleware({app});

module.exports = app;
