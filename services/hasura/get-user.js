import gql from "graphql-tag";
import get from "lodash/get";
import bcrypt from "bcryptjs";

import { UserFragment, UserVerificationFragment } from "../../fragments";
import { isEmail, isPhone } from "../../validators";
import * as constants from '../../helpers/values';
import { getUserById } from "./get-user-by-id";
import { hasuraQuery } from "../client";

export const getUserByCredentials = async (usernameEmailOrPhone, password) => {
    let user;
    let userVerifications;
    let searchType;
    if (isEmail(usernameEmailOrPhone)) {
        searchType = 'email';
        user = await getUserByEmail(usernameEmailOrPhone);
    } else if (isPhone(usernameEmailOrPhone)) {
        searchType = 'phone';
        user = await getUserByPhone(usernameEmailOrPhone);
    } else {
        searchType = 'username';
        user = await getUserByUsername(usernameEmailOrPhone);
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

export const getUserByUsername = async (username, fragment = UserFragment) => {
    return getUser('username', username, fragment);
}

export const getUserByEmail = async (email, fragment = UserFragment) => {
    return getUser('email', email, fragment);
}

export const getUserByPhone = async (phone, fragment = UserFragment) => {
    return getUser('phone', phone.replace(/^\++/, ''), fragment);
}

export const getUserByPhoneVerifyToken = async (phone) => {
    return getUser('phone', phone.replace(/^\++/, ''));
}

export const getUserByEmailVerifyToken = async (token) => {
	const userVerification = await getUserVerification('email_verify_token', token);
	if (!userVerification) {
		throw new Error('Wrong token is provided.');
	}
	return getUserById(userVerification.user_id);
}

const getUser = async (attribute, value, fragment = UserFragment) => {
    try {
        let condition = {};
        let where = {};
        where[attribute] = { _eq: value };
        condition.where = where;
        const response = await hasuraQuery(
            gql`
                ${fragment}
                query($where: users_bool_exp) {
                    users(where: $where) {
                        ...User
                    }
                }
            `,
            condition,
        );

        return get(response, 'data.users[0]');
    } catch (e) {
        // throw new Error('Unable to find the email');
        throw new Error(e.message);
    }
}

const getUserVerification = async (attribute, value, fragment = UserVerificationFragment) => {
	try {
		let condition = {};
		let where = {};
		where[attribute] = { _eq: value };
		condition.where = where;
		const response = await hasuraQuery(
			gql`
				${fragment}
				query($where: user_verifications_bool_exp) {
					user_verifications(where: $where) {
						...UserVerification
					}
				}
			`,
			condition,
		);

		return get(response, 'data.user_verifications[0]');
	} catch (e) {
		throw new Error(e.message);
	}
}
