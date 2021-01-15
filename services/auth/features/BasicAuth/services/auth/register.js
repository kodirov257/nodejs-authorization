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
	username;
	emailOrPhone;
	password;
	getUser;
	registerData;
	fragment;

	constructor(username, emailOrPhone, password) {
		this.username = username;
		this.emailOrPhone = emailOrPhone;
		this.password = password;
		this.fragment = UserFragment;

		this.getUser = new GetUser();
	};

	validate = () => {
		return validateRegistration(this.username, this.emailOrPhone, this.password);
	};

	getUserByUsername = async () => {
		return await this.getUser.getUserByUsername(this.username, this.fragment);
	};

	getUserByEmail = async () => {
		return await this.getUser.getUserByEmail(this.emailOrPhone, this.fragment);
	};

	getUserByPhone = async () => {
		return await this.getUser.getUserByPhone(this.emailOrPhone, this.fragment);
	};

	getParams = async () => {
		const passwordHash = await bcrypt.hash(this.password, 10);

		return {
			username: this.username.replace(/ /g, ''),
			email: isEmail(this.emailOrPhone) ? this.emailOrPhone : null,
			phone: isPhone(this.emailOrPhone) ? this.emailOrPhone.replace(/^\++/, '') : null,
			password: passwordHash,
			role: constants.ROLE_USER,
			secret_token: uuidv4() + '-' + (+new Date()),
			status: constants.STATUS_ACTIVE,
		};
	};

	async register() {
		const value = this.validate();
		this.emailOrPhone = value.emailOrPhone;

		let user = await this.getUserByUsername();

		if (user) {
			throw new Error('Username already registered');
		}

		if (isEmail(this.emailOrPhone)) {
			user = await this.getUserByEmail();
		} else if (isPhone(this.emailOrPhone)) {
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
