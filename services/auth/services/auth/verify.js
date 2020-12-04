import get from "lodash/get";
import gql from "graphql-tag";

import { validateVerifyEmail, validateVerifyPhone } from "../../validators";
import { getUserByEmailVerifyToken, getUserByPhoneVerifyToken, updateUser } from "..";
import * as constants from "../../helpers/values";

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

    const result = await updateUser(user.id, fields);

    return get(result, 'data.update_users_by_pk') !== undefined;
}

export const verifyPhone = async (phone, token) => {
    validateVerifyPhone(phone, token);
    phone = phone.replace(/^\++/, '');

    let user = await getUserByPhoneVerifyToken(phone);

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

    const result = await updateUser(user.id, fields);
    console.log(result);
    console.log(get(result, 'data.update_users_by_pk'));

    return get(result, 'data.update_users_by_pk') !== undefined;
}