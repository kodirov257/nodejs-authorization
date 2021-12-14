import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import http from 'http';

import { indexRouter } from './routes';
import { graphqlRouter } from './routes/graphql';
import { usersRouter } from './routes/users';
import { resolvers } from './routes/auth';

import { typeDefs } from './typeDefs';

require('custom-env').env();

let app = express();

const httpServer = http.createServer(app);
let port = normalizePort(process.env.PORT || '3000');

async function runServer() {
  app.use(bodyParser.json());
  // app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  app.use('/', indexRouter);
  app.use('/users', usersRouter);
  // app.use('/graphql', graphqlRouter);

// catch 404 and forward to error handler
  app.use(function(req, res, next) {
    next(createError(404));
  });

// error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.send('error');
  });

  app.set('port', port);

  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs: typeDefs,
    resolvers: resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();
  server.applyMiddleware({ app });
  await new Promise(resolve => httpServer.listen(port, resolve));
  console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`);
}

void runServer();

function normalizePort(val) {
  let port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

module.exports = {
  app,
  httpServer
};
