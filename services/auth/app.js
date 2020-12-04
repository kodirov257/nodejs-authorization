import express from 'express';
import { ApolloServer, UserInputError, ValidationError } from 'apollo-server-express';
import gql from 'graphql-tag';
import { typeDefs } from './typeDefs';
import get from 'lodash/get';
import fetch from 'node-fetch';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import passport from 'passport';
let JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
import { GraphQLLocalStrategy, buildContext } from 'graphql-passport';
require('custom-env').env();

import { generateClaimsJwtToken, generateJwtRefreshToken } from './helpers/auth-tools';
import { UserFragment, UserSessionFragment, UserRegistrationFragment } from './fragments';
import {
  getCurrentUserId,
  isAuthenticated,
  getUserById,
  verifyEmail,
  verifyPhone,
  login,
  register,
  resendEmail,
  resendPhone,
} from "./services";
import { isEmail, isPhone, validateRegistration, validateVerifyEmail, validateVerifyPhone } from './validators';
import * as constants from './helpers/values';
const authRouter = require('./routes/auth');

let opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_PRIVATE_KEY,
  algorithms: [process.env.JWT_ALGORITHM],
};
passport.use(new JwtStrategy(opts, function (jwt_payload, done) {

}));

/*passport.use('api', new OAuth2Strategy({
      authorizationURL: 'https://www.provider.com/oauth2/authorize',
      tokenURL: 'https://www.provider.com/oauth2/token',
      clientID: '123-456-789',
      clientSecret: 'shhh-its-a-secret',
      callbackURL: 'https://www.example.com/auth/provider/callback'
    },
    function (username, password, done) {
      const user = getUserByUsername(username);

      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }

      const passwordMatch = bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, user);
    }
));*/

const resolvers = {
  Query: {
    hello: () => 'Hello world !',
    auth_me: async (_, args, ctx) => {
      if (!isAuthenticated(ctx.req)) {
        throw new Error('Authorization token has not provided');
      }

      try {
        const currentUserId = getCurrentUserId(ctx.req);

        return await getUserById(currentUserId);
      } catch (e) {
        throw new Error('Not logged in');
      }
    },
  },
  Mutation: {
    auth_register: async (_, {username, email_or_phone, password}) => {
      return register(username, email_or_phone, password)
    },
    verify_email: async (_, {token}, ctx) => {
      return verifyEmail(token)
    },
    verify_phone: async (_, {phone, token}, ctx) => {
      return verifyPhone(phone, token);
    },
    auth_login: async (_, {username_email_or_phone, password}, ctx) => {
      return login(username_email_or_phone, password, ctx);
    },
    resend_email: async (_, {email}) => {
      return resendEmail(email);
    },
    resend_phone: async (_, {phone}) => {
      return resendPhone(phone);
    },
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) => buildContext({ req, res })
});

const app = express();
app.use(passport.initialize());
app.use('/', authRouter);
server.applyMiddleware({ app });

// const port = process.env.PORT;
// app.listen({ port: port }, () =>
//     console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)
// );

module.exports = app;