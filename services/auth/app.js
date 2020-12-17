import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from './typeDefs';
import passport from 'passport';
let JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
import { buildContext } from 'graphql-passport';

require('dotenv-flow').config();
import {
  getCurrentUserId,
  isAuthenticated,
  getUserById,
  verifyEmail,
  verifyPhone,
  singin,
  register,
  resendEmail,
  resendPhone, sendResetEmail, sendResetPhone, resetViaEmail, resetViaPhone, changePassword, refreshToken,
} from "./services";
import { log } from "./services/log";
const authRouter = require('./routes/auth');

// let opts = {
//   jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//   secretOrKey: process.env.JWT_PRIVATE_KEY,
//   algorithms: [process.env.JWT_ALGORITHM],
// };
// passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
//
// }));

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
      } catch (error) {
        throw new Error('Not logged in');
      }
    },
  },
  Mutation: {
    register: async (_, {username, email_or_phone, password}) => {
      try {
        return register(username, email_or_phone, password);
      } catch (error) {
        throw error;
      }
    },
    verify_email: async (_, {token}, ctx) => {
      try {
        return verifyEmail(token);
      } catch (error) {
        await log(error);
        throw error;
      }
    },
    verify_phone: async (_, {phone, token}, ctx) => {
      try {
        // await log(new Error('Refresh token is not provided.'));
        return verifyPhone(phone, token);
      } catch (error) {
        await log(error);
        throw error;
      }
    },
    signin: async (_, {login, password}, ctx) => {
      try {
        return singin(login, password, ctx);
      } catch (error) {
        await log(error);
        throw error;
      }
    },
    resend_email: async (_, {email}) => {
      try {
        return resendEmail(email);
      } catch (error) {
        await log(error);
        throw error;
      }
    },
    resend_phone: async (_, {phone}) => {
      try {
        return resendPhone(phone);
      } catch (error) {
        await log(error);
        throw error;
      }
    },
    send_reset_email: async (_, {email}) => {
      try {
        return sendResetEmail(email);
      } catch (error) {
        await log(error);
        throw error;
      }
    },
    send_reset_phone: async (_, {phone}) => {
      try {
        return sendResetPhone(phone);
      } catch (error) {
        await log(error);
        throw error;
      }
    },
    reset_via_email: async (_, {token, password}) => {
      try {
        return resetViaEmail(token, password);
      } catch (error) {
        await log(error);
        throw error;
      }
    },
    reset_via_phone: async (_, {phone, token, password}) => {
      try {
        return resetViaPhone(phone, token, password);
      } catch (error) {
        await log(error);
        throw error;
      }
    },
    change_password: async (_, {old_password, new_password}, ctx) => {
      try {
        return changePassword(old_password, new_password, ctx)
      } catch (error) {
        await log(error);
        throw error;
      }
    },
    refresh_token: async (_, {refresh_token}, ctx) => {
      try {
        if (!refresh_token) {
          throw new Error('Refresh token is not provided.');
        }

        return refreshToken(refresh_token, ctx);
      } catch (error) {
        await log(error);
        throw error;
      }
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) => buildContext({ req, res }),
  formatError: (error) => {
    log(error);
    throw error;
  },
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