require('dotenv-flow').config();
import path from 'path';
import fs from 'fs';

import { getUserById, Register, Signin, ChangePassword, RefreshToken, AddEmail, AddPhone } from './services';
import { isAuthenticated, getCurrentUserId } from '../../core/helpers/user';
import { services } from '../../core/config';

export class BasicAuth {
	addEmailService;
	addPhoneService;

	constructor() {
		this.addEmailService = AddEmail;
		this.addPhoneService = AddPhone;
	}

	hello() {
		return 'Hello world !';
	}

	async auth_me(_, args, ctx) {
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

	abilities = () => {
		return services;
	}

	ability_values = (type) => {
		if (!type || !services.includes(type)) {
			throw new Error('Type is not provided.');
		}

		const fileName = path.resolve(__dirname, '../../env.json');
		const environment = JSON.parse(fs.readFileSync(fileName, 'utf-8'));
		const serviceName = type.split('Auth')[0].toLowerCase();
		const templateEnv = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../env.${serviceName}.json`), 'utf-8'));

		let result = {};
		for (const value in templateEnv) {
			if (environment[value]) {
				result[value] = environment[value];
			} else {
				result[value] = templateEnv[value];
			}
		}

		result.service = type;
		return JSON.stringify(result);
	}

	register = async (_, {login, password}) => {
		return (new Register(login, password)).register();
	}

	signin = async (_, {login, password}, ctx) => {
		return (new Signin(login, password, ctx)).signin();
	}

	change_password = async (_, {old_password, new_password}, ctx) => {
		return (new ChangePassword(old_password, new_password, ctx)).changePassword();
	}

	refresh_token = async (_, ctx) => {
		return (new RefreshToken(ctx)).refreshToken();
	}

	add_email = async (_, {email}, ctx) => {
		return (new this.addEmailService({email, ctx})).addEmail();
	}

	add_phone = async (_, {phone}, ctx) => {
		return (new this.addPhoneService({phone, ctx})).addPhone();
	}


	resolvers() {
		return {
			Query: {
				hello: () => this.hello(),
				auth_me: async (_, args, ctx) => this.auth_me(_, args, ctx),
				abilities: (_, args, ctx) => this.abilities(),
				ability_values: (_, {type}, ctx) => this.ability_values(type),
			},
			Mutation: {
				register: async (_, {login, password}, ctx) =>
					this.register(_, {login, password}),
				signin: async (_, {login, password}, ctx) =>
					this.signin(_, {login, password}, ctx),
				change_password: async (_, {old_password, new_password}, ctx) =>
					this.change_password(_, {old_password, new_password}, ctx),
				refresh_token: async (_, args, ctx) =>
					this.refresh_token(_, ctx),
				add_email: async (_, {email}, ctx) =>
					this.add_email(_, {email}, ctx),
				add_phone: async (_, {phone}, ctx) =>
					this.add_phone(_, {phone}, ctx),
			},
		}
	}
}