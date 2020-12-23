require('dotenv-flow').config();
import { ApolloServer } from 'apollo-server-express';
import { buildContext } from 'graphql-passport';
import { typeDefs } from './typeDefs';
import bodyParser from "body-parser"
import passport from 'passport';
import express from 'express';

import {
	getCurrentUserId,
	isAuthenticated,
	getUserById,
	verifyEmail,
	verifyPhone,
	singin,
	register,
	resendEmail,
	resendPhone,
	sendResetEmail,
	sendResetPhone,
	resetViaEmail,
	resetViaPhone,
	changePassword,
	refreshToken,
	sendEmailAddEmailToken,
	addEmail,
	addPhone,
	sendAddPhoneToken,
} from "./services";
import { log } from "./services/log";
const authRouter = require('./routes/auth');

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
      return register(username, email_or_phone, password);
    },
    verify_email: async (_, {token}, ctx) => {
      return verifyEmail(token);
    },
    verify_phone: async (_, {phone, token}, ctx) => {
      return verifyPhone(phone, token);
    },
    signin: async (_, {login, password}, ctx) => {
      return singin(login, password, ctx);
    },
    resend_email: async (_, {email}) => {
      return resendEmail(email);
    },
    resend_phone: async (_, {phone}) => {
      return resendPhone(phone);
    },
    send_reset_email: async (_, {email}) => {
      return sendResetEmail(email);
    },
    send_reset_phone: async (_, {phone}) => {
      return sendResetPhone(phone);
    },
    reset_via_email: async (_, {token, password}) => {
      return resetViaEmail(token, password);
    },
    reset_via_phone: async (_, {phone, token, password}) => {
      return resetViaPhone(phone, token, password);
    },
    change_password: async (_, {old_password, new_password}, ctx) => {
      return changePassword(old_password, new_password, ctx)
    },
    refresh_token: async (_, {refresh_token}, ctx) => {
      if (!refresh_token) {
        throw new Error('Refresh token is not provided.');
      }

      return refreshToken(refresh_token, ctx);
    },
    send_add_email_token: async (_, {email}, ctx) => {
      return sendEmailAddEmailToken(email, ctx);
    },
    add_email: async (_, {token}, ctx) => {
    	return addEmail(token, ctx);
	},
    send_add_phone_token: async (_, {phone}, ctx) => {
      return sendAddPhoneToken(phone, ctx);
    },
    add_phone: async (_, {phone, token}, ctx) => {
    	return addPhone(phone, token, ctx);
	},
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
app.use(bodyParser.json())
app.use('/', authRouter);
server.applyMiddleware({ app });

module.exports = app;
