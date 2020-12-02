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
const Joi = require('@hapi/joi');

import { generateClaimsJwtToken, generateJwtRefreshToken } from './helpers/auth-tools';
import { UserFragment, UserSessionFragment } from './fragments';
import {
  createUserSession,
  getCurrentUserId,
  getUserByUsername,
  isAuthenticated,
  getUserById,
  getUserByEmail,
  getUserByPhone,
  hasuraQuery,
} from "./services";
import { isEmail, isPhone } from './validators';

const STATUS_INACTIVE = 1;
const STATUS_ACTIVE = 5;

const ROLE_USER = 'user';
const ROLE_ADMIN = 'admin';
const ROLE_MODERATOR = 'moderator';

async function getUserByCredentials(username, password) {
  const user = await getUserByUsername(username);

  if (!user) {
    throw new Error('Invalid "username" or "password"');
  }

  if (user.status !== STATUS_ACTIVE) {
    throw new Error('User not activated.');
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new Error('Invalid "email" or "password"');
  }

  return user;
}

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
    }
  },
  Mutation: {
    async auth_register (_, {username, email_or_phone, password}) {
      const schema = Joi.object({
        username: Joi.string().alphanum().min(3).max(30).required(),
        email_or_phone: Joi.string().min(5).max(50).required(),
        password: Joi.string().min(5).max(50).required(),
      });

      const { value, error } = schema.validate({ username, email_or_phone, password }, { abortEarly: false });
      if (error) {
        throw new UserInputError('Failed to register the user.', {
          validationErrors: error.details
        });
      }

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

      const result = await hasuraQuery(
          gql`
            ${UserFragment}
            mutation ($user: users_insert_input!) {
              insert_users(objects: [$user]) {
                returning {
                  ...User
                }
              }
            }
          `,
          {
            user: {
              username: username,
              email: isEmail(value.email_or_phone) ? value.email_or_phone : null,
              phone: isPhone(value.email_or_phone) ? value.email_or_phone : null,
              password: passwordHash,
              role: ROLE_USER,
              secret_token: uuidv4(),
              status: STATUS_ACTIVE,
            }
          }
      );

      const data = get(result, 'data.insert_users.returning');

      return data !== undefined;
    },
    async auth_login (_, {username, email, phone, password}, ctx) {
      const user = await getUserByCredentials(username, password);

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
server.applyMiddleware({ app });

// const port = process.env.PORT;
// app.listen({ port: port }, () =>
//     console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)
// );

module.exports = app;