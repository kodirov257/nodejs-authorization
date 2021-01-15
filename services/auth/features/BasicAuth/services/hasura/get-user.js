import bcrypt from 'bcryptjs';
import gql from 'graphql-tag';
import get from 'lodash/get';

import { isEmail, isPhone } from '../../../../core/validators';
import * as constants from '../../../../core/helpers/values';
import { hasuraQuery } from '../../../../core/services';
import { UserFragment } from '../../fragments';

export class GetUser {
	getUserByCredentials = async (usernameEmailOrPhone, password) => {
		let user;
		if (isEmail(usernameEmailOrPhone)) {
			user = await this.getUserByEmail(usernameEmailOrPhone);
		} else if (isPhone(usernameEmailOrPhone)) {
			user = await this.getUserByPhone(usernameEmailOrPhone);
		} else {
			user = await this.getUserByUsername(usernameEmailOrPhone);
		}

		if (!user) {
			throw new Error('Invalid "username" or "password"');
		}

		const passwordMatch = await bcrypt.compare(password, user.password);

		if (!passwordMatch) {
			throw new Error('Invalid "username" or "password"');
		}

		if (user.status !== constants.STATUS_ACTIVE) {
			throw new Error('User not activated.');
		}

		return user;
	}

	getUserByUsername = async (username, fragment = UserFragment) => {
		return this.getUser('username', username, fragment);
	}

	getUserByEmail = async (email, fragment = UserFragment) => {
		return this.getUser('email', email, fragment);
	}

	getUserByPhone = async (phone, fragment = UserFragment) => {
		return this.getUser('phone', phone.replace(/^\++/, ''), fragment);
	}

	getUser = async (attribute, value, fragment = UserFragment) => {
		try {
			let condition = {};
			let where = {};
			where[attribute] = {_eq: value};
			condition.where = where;
			const response = await hasuraQuery(
				gql`
					${fragment}
					query($where: auth_users_bool_exp) {
						auth_users(where: $where) {
							...User
						}
					}
				`,
				condition,
			);

			return get(response, 'data.auth_users[0]');
		} catch (e) {
			// throw new Error('Unable to find the email');
			throw new Error(e.message);
		}
	}
}
