const moment = require('moment');
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import gql from 'graphql-tag';
import get from 'lodash/get';

import { isEmail, isPhone, validateRegistration } from '../../../../core/validators';
import * as constants from '../../../../core/helpers/values';
import { ROLE_USER } from '../../../../core/helpers/values';
import { UserFragment } from '../../fragments';
import {
	GetUser,
	hasuraQuery,
} from '../index';

export class Register {
	login;
	password;
	getUserService;
	registerData;
	fragment;

	constructor(login, password) {
		this.login = login;
		this.password = password;
		this.fragment = UserFragment;

		this.getUserService = new GetUser();
	};

	validate = () => {
		return validateRegistration(this.login, this.password);
	};

	getUserByUsername = async () => {
		return await this.getUserService.getUserByUsername(this.login, this.fragment);
	};

	getUserByEmail = async () => {
		return await this.getUserService.getUserByEmail(this.login, this.fragment);
	};

	getUserByPhone = async () => {
		return await this.getUserService.getUserByPhone(this.login, this.fragment);
	};

	getUser = async () => {
		if (isEmail(this.login)) {
			return this.getUserByEmail();
		} else if (isPhone(this.login)) {
			return this.getUserByPhone();
		}
		return this.getUserByUsername();
	}

	getParams = async () => {
		const passwordHash = await bcrypt.hash(this.password, 10);

		return {
			username: !isEmail(this.login) && !isPhone(this.login) ? this.login.replace(/ /g, '') : `${ROLE_USER}${moment().unix()}`,
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

		let user = await this.getUser();

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

		this.registerData = get(result, 'data.insert_auth_users.returning') || undefined;
		if (!this.registerData) {
			throw new Error('User is not registered.');
		}

		return true;
	};
}
