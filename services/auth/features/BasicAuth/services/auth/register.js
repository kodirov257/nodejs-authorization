import { ValidationError } from 'apollo-server-express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import gql from 'graphql-tag';
import get from 'lodash/get';

import { isEmail, isPhone, validateRegistration } from '../../../../core/validators';
import * as constants from '../../../../core/helpers/values';
import { UserFragment } from '../../fragments';
import {
	GetUser,
	hasuraQuery,
} from '../index';

export class Register {
	login;
	// username;
	// emailOrPhone;
	password;
	getUser;
	registerData;
	fragment;

	constructor(login, password) {
		this.login = login;
		// this.username = username;
		// this.emailOrPhone = emailOrPhone;
		this.password = password;
		this.fragment = UserFragment;

		this.getUser = new GetUser();
	};

	validate = () => {
		return validateRegistration(this.login, this.password);
	};

	// getUserByUsername = async () => {
	// 	return await this.getUser.getUserByUsername(this.username, this.fragment);
	// };

	getUserByEmail = async () => {
		return await this.getUser.getUserByEmail(this.login, this.fragment);
	};

	getUserByPhone = async () => {
		return await this.getUser.getUserByPhone(this.login, this.fragment);
	};

	getParams = async () => {
		const passwordHash = await bcrypt.hash(this.password, 10);

		return {
			// username: this.username.replace(/ /g, ''),
			email: isEmail(this.login) ? this.login : null,
			phone: isPhone(this.login) ? this.login.replace(/^\++/, '') : null,
			password: passwordHash,
			role: constants.ROLE_USER,
			secret_token: uuidv4() + '-' + (+new Date()),
			status: constants.STATUS_ACTIVE,
		};
	};

	async register() {
		const value = this.validate();
		this.login = value.login;

		// let user = await this.getUserByUsername();
		//
		// if (user) {
		// 	throw new Error('Username already registered');
		// }
		let user;

		if (isEmail(this.login)) {
			user = await this.getUserByEmail();
		} else if (isPhone(this.login)) {
			user = await this.getUserByPhone();
		} else {
			throw new ValidationError('Wrong email or phone is given.');
		}

		if (user) {
			throw new Error('Username already registered');
		}

		const params = await this.getParams();

		const result = await hasuraQuery(
			gql`
				${this.fragment}
				mutation ($user: auth_users_insert_input!) {
					insert_auth_users(objects: [$user]) {
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

		console.log(result);
		// console.log(result.errors[0].extensions);
		// console.log(JSON.stringify(result));
		// console.log(result.errors[0].extensions.internal.statement);
		// console.log(result.errors[0]);

		this.registerData = get(result, 'data.insert_auth_users.returning');

		return this.registerData !== undefined;
	};
}
