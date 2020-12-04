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
        user = await getUserByEmail(usernameEmailOrPhone);
    } else if (isPhone(usernameEmailOrPhone)) {
        searchType = 'phone';
        user = await getUserByPhone(usernameEmailOrPhone);
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

export const getUserByUsername = async (username) => {
    return getUser('username', username);
}

export const getUserByEmailVerifyToken = async (token) => {
    return getUser('email_verify_token', token, UserRegistrationFragment);
}

export const getUserByEmail = async (email) => {
    return getUser('email', email);
}

export const getUserByPhone = async (phone) => {
    return getUser('phone', phone.replace(/^\++/, ''));
}

export const getUserByPhoneVerifyToken = async (phone) => {
    return getUser('phone', phone, UserRegistrationFragment);
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