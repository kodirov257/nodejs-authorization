import gql from "graphql-tag";
import get from "lodash/get";
import bcrypt from "bcryptjs";

import { hasuraQuery } from "../client";
import {UserFragment, UserRegistrationFragment} from "../../fragments";
import { isEmail, isPhone } from "../../validators";
import * as constants from '../../helpers/values';

export const getUserByCredentials = async (usernameEmailOrPhone, password) => {
    let user;
    let searchType;
    if (isEmail(usernameEmailOrPhone)) {
        searchType = 'email';
        user = await getUserByEmail(usernameEmailOrPhone, UserRegistrationFragment);
    } else if (isPhone(usernameEmailOrPhone)) {
        searchType = 'phone';
        user = await getUserByPhone(usernameEmailOrPhone, UserRegistrationFragment);
    } else {
        searchType = 'username';
        user = await getUserByUsername(usernameEmailOrPhone);
    }

    if (!user) {
        throw new Error('Invalid "username" or "password"');
    }

    if (user.status !== constants.STATUS_ACTIVE
        || (searchType === 'email' && !user.email_verified)
        || (searchType === 'phone' && !user.phone_verified)) {
        throw new Error('User not activated.');
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

export const getUserByEmailVerifyToken = async (token, fragment = UserRegistrationFragment) => {
    return getUser('email_verify_token', token, fragment);
}

export const getUserByEmail = async (email, fragment = UserFragment) => {
    return getUser('email', email, fragment);
}

export const getUserByPhone = async (phone, fragment = UserFragment) => {
    return getUser('phone', phone.replace(/^\++/, ''), fragment);
}

export const getUserByPhoneVerifyToken = async (phone) => {
    return getUser('phone', phone.replace(/^\++/, ''), UserRegistrationFragment);
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