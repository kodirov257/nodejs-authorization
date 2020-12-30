require('dotenv-flow').config();
import { ApolloServer } from 'apollo-server-express';
import { buildContext } from 'graphql-passport';
import bodyParser from 'body-parser';
import { log } from './services/log';
import passport from 'passport';
import express from 'express';
import fs from 'fs';

import { typeDefs as verifyTypeDef } from './features/VerifyAuth/typeDefs';
import { typeDefs as basicTypeDef } from './features/BasicAuth/typeDefs';
import { VerifyAuth } from './features/VerifyAuth/resolvers';
import { BasicAuth } from './features/BasicAuth/resolvers';
const indexRouter = require('./routes/index');
const userRouter = require('./routes/users');
const authRouter = require('./routes/auth');

const service = JSON.parse(fs.readFileSync('service.json', 'utf-8'));

const resolvers = () => {
  console.log(service);
  switch (service.service) {
    case 'VerifyAuth':
      return (new VerifyAuth()).resolvers();
    case 'BasicAuth':
      return (new BasicAuth()).resolvers();
    default:
      throw new Error('Wrong service.');
  }
};

const typeDef = () => {
  console.log(service);

  switch (service.service) {
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
app.use(passport.initialize());
app.use(bodyParser.json())
app.use('/', authRouter);
app.use('/', indexRouter);
app.use('/users', userRouter);
server.applyMiddleware({app});

module.exports = app;
