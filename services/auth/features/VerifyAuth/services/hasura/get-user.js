import gql from 'graphql-tag';
import bcrypt from 'bcryptjs';
import get from 'lodash/get';

import { getUserById, GetUser as BasicGetUser } from '../../../BasicAuth/services';
import { UserVerificationFragment, UserFragment } from '../../fragments';
import { isEmail, isPhone } from '../../../../core/validators';
import { hasuraQuery } from '../../../../core/services';
import * as constants from '../../helpers/values';

export class GetUser extends BasicGetUser {
	getUserByCredentials = async (usernameEmailOrPhone, password) => {
		let user;
		let userVerifications;
		let searchType;
		if (isEmail(usernameEmailOrPhone)) {
			searchType = 'email';
			user = await this.getUserByEmail(usernameEmailOrPhone, UserFragment);
		} else if (isPhone(usernameEmailOrPhone)) {
			searchType = 'phone';
			user = await this.getUserByPhone(usernameEmailOrPhone, UserFragment);
		} else {
			searchType = 'username';
			user = await this.getUserByUsername(usernameEmailOrPhone, UserFragment);
		}

		if (!user || !user.user_verifications || !(userVerifications = user.user_verifications[0])) {
			throw new Error('Invalid "username" or "password"');
		}

		if (user.status !== constants.STATUS_ACTIVE && user.status === constants.STATUS_INACTIVE) {
			throw new Error('User not activated.');
		}

		if (user.status === constants.STATUS_VERIFIED
			&& ((searchType === 'username' && (userVerifications.email_verified === false
					|| userVerifications.phone_verified === false))
				|| (searchType === 'email' && userVerifications.email_verified === false)
				|| (searchType === 'phone' && userVerifications.phone_verified === false)
			)
		) {
			throw new Error('User need to be verified.');
		}

		const passwordMatch = await bcrypt.compare(password, user.password);

		if (!passwordMatch) {
			throw new Error('Invalid "username" or "password"');
		}

		return user;
	}

	getUserByPhoneVerifyToken = async (phone) => {
		return this.getUser('phone', phone.replace(/^\++/, ''), UserFragment);
	}

	getUserByEmailVerifyToken = async (token) => {
		const userVerification = await this.getUserVerification('email_verify_token', token);
		if (!userVerification) {
			throw new Error('Wrong token is provided.');
		}
		return getUserById(userVerification.user_id, UserFragment);
	}

	getUserVerification = async (attribute, value, fragment = UserVerificationFragment) => {
		try {
			let condition = {};
			let where = {};
			where[attribute] = { _eq: value };
			condition.where = where;
			const response = await hasuraQuery(
				gql`
					${fragment}
					query($where: auth_user_verifications_bool_exp) {
						auth_user_verifications(where: $where) {
							...UserVerification
						}
					}
				`,
				condition,
			);

			return get(response, 'data.auth_user_verifications[0]') || undefined;
		} catch (e) {
			throw new Error(e.message);
		}
	}
}
