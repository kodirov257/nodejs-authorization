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
const moment = require('moment');

import { generateClaimsJwtToken, generateJwtRefreshToken } from './helpers/auth-tools';
import { UserFragment, UserSessionFragment, UserRegistrationFragment } from './fragments';
import {
  createUserSession,
  getCurrentUserId,
  getUserByUsername,
  isAuthenticated,
  getUserById,
  getUserByEmail,
  getUserByPhone,
  getUserByEmailVerifyToken,
  getUserByCredentials,
  hasuraQuery,
  sendEmailVerifyToken,
  sendSmsVerifyToken,
} from "./services";
import { isEmail, isPhone, validateRegistration, validateVerifyEmail } from './validators';
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
    async auth_register (_, {username, email_or_phone, password}) {
      const value = validateRegistration({ username, email_or_phone, password });

      let user = await getUserByUsername(value.username);

      if (user) {
        throw new Error('Username already registered');
      }

      if (isEmail(value.email_or_phone)) {
        user = await getUserByEmail(value.email_or_phone);
      } else if (isPhone(value.email_or_phone)) {
        user = await getUserByPhone(value.email_or_phone);
      } else {
        throw new ValidationError('Wrong email or phone is given.');
      }

      if (user) {
        throw new Error('Username already registered');
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const params = {
        username: username.replace(/ /g, ''),
        email: isEmail(value.email_or_phone) ? value.email_or_phone : null,
        phone: isPhone(value.email_or_phone) ? value.email_or_phone : null,
        password: passwordHash,
        role: constants.ROLE_USER,
        secret_token: uuidv4() + '-' + (+new Date()),
        status: constants.STATUS_INACTIVE,
      };
      if (isEmail(value.email_or_phone)) {
        params.email = value.email_or_phone;
        params.email_verify_token = uuidv4() + '-' + (+new Date());
      } else {
        params.phone = value.email_or_phone;
        params.phone_verify_token = Math.floor(Math.random() * 99999) + 10000;
        params.phone_verify_token_expire = moment().add(5, 'minutes').format('Y-M-D H:mm:ss');
      }

      const result = await hasuraQuery(
          gql`
            ${UserRegistrationFragment}
            mutation ($user: users_insert_input!) {
              insert_users(objects: [$user]) {
                returning {
                  ...User
                }
              }
            }
          `,
          {
            user: params
          }
      );

      let data = get(result, 'data.insert_users.returning');
      if (data !== undefined && (data = data[0]) !== undefined) {
        if (data.email) {
          await sendEmailVerifyToken(data);
        } else {
          await sendSmsVerifyToken(data);
        }

        return true;
      }

      return false;
    },
    verify_email: async (_, {token}, ctx) => {
      validateVerifyEmail(token);

      let user = await getUserByEmailVerifyToken(token);

      const result = await hasuraQuery(
          gql`
            ${UserRegistrationFragment}
            mutation ($user: update_users_by_pk) {
              users_set_input(_set: [$user]) {
                returning {
                  ...User
                }
              }
            }
          `,
          {
            user: {
              id: user.id,
              email_verified: true,
              email_verify_token: null,
              status: constants.STATUS_ACTIVE,
            }
          }
      );

      return get(result, 'data.insert_users.returning') !== undefined;
    },
    async auth_login (_, {username_email_or_phone, password}, ctx) {
      const user = await getUserByCredentials(username_email_or_phone, password);

      const ipAddress = (
          ctx.req.headers['x-forwarded-for'] || ctx.req.connection.remoteAddress || ''
      ).split(',')[0].trim();

      const [refreshToken, sessionId] = await createUserSession(user, ctx.req.headers['user-agent'], ipAddress);

      const accessToken = await generateClaimsJwtToken(user, sessionId);

      return {
        access_token: accessToken,
        refresh_token: generateJwtRefreshToken({
          token: refreshToken,
        }),
        user_id: user.id,
      };
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