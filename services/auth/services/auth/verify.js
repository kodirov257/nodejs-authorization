import {validateVerifyEmail, validateVerifyPhone} from "../../validators";
import {getUserByEmailVerifyToken, getUserByPhone, hasuraQuery, updateUser} from "..";
import gql from "graphql-tag";
import {UserRegistrationFragment} from "../../fragments";
import * as constants from "../../helpers/values";
import get from "lodash/get";

export const verifyEmail = async (token) => {
    validateVerifyEmail(token);

    let user = await getUserByEmailVerifyToken(token);

    if (!user) {
        throw new Error('Invalid token');
    }

    const fields = {
        email_verified: true,
        email_verify_token: null,
        status: constants.STATUS_ACTIVE,
    };

    const result = updateUser(user.id, fields);

    return get(result, 'data.update_users_by_pk') !== undefined;
}

export const verifyPhone = async (phone, token) => {
    validateVerifyPhone(phone, token);
    phone = phone.replace(/^\++/, '');

    let user = await getUserByPhone(phone);

    if (!user) {
        throw new Error('Invalid phone');
    }

    if (user.phone_verify_token !== token) {
        throw new Error('Invalid token');
    }

    const fields = {
        phone_verified: true,
        phone_verify_token: null,
        phone_verify_token_expire: null,
        status: constants.STATUS_ACTIVE,
    };

    const result = updateUser(user.id, fields);

    return get(result, 'data.update_users_by_pk') !== undefined;
}