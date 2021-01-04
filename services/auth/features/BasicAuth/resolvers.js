require('dotenv-flow').config();

import { getUserById, Register, Signin, ChangePassword, RefreshToken } from './services';
import { isAuthenticated, getCurrentUserId } from '../../core/helpers/user';

export class BasicAuth {
	hello = () => 'Hello world !';

	auth_me = async (_, args, ctx) => {
		if (!isAuthenticated(ctx.req)) {
			throw new Error('Authorization token has not provided');
		}

		try {
			const currentUserId = getCurrentUserId(ctx.req);

			return await getUserById(currentUserId);
		} catch (error) {
			throw new Error('Not logged in');
		}
	}

	register = async (_, {username, email_or_phone, password}) => {
		return (new Register(username, email_or_phone, password)).register();
	}

	signin = async (_, {login, password}, ctx) => {
		return (new Signin(login, password, ctx)).signin();
	}

	change_password = async (_, {old_password, new_password}, ctx) => {
		return (new ChangePassword(old_password, new_password, ctx)).changePassword();
	}

	refresh_token = async (_, {refresh_token}, ctx) => {
		if (!refresh_token) {
			throw new Error('Refresh token is not provided.');
		}

		return (new RefreshToken(refresh_token, ctx)).refreshToken();
	}


	resolvers() {
		return {
			Query: {
				hello: () => this.hello(),
				auth_me: async (_, args, ctx) => this.auth_me(_, args, ctx),
			},
			Mutation: {
				register: async (_, {username, email_or_phone, password}, ctx) =>
					this.register(_, {username, email_or_phone, password}),
				signin: async (_, {login, password}, ctx) =>
					this.signin(_, {login, password}, ctx),
				change_password: async (_, {old_password, new_password}, ctx) =>
					this.change_password(_, {old_password, new_password}, ctx),
				refresh_token: async (_, {refresh_token}, ctx) =>
					this.refresh_token(_, {refresh_token}, ctx),
			},
		}
	}
}



