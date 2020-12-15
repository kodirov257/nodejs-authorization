const moment = require('moment');
import get from "lodash/get";

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
        updated_at: moment().format('Y-M-D H:mm:ss'),
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

    const expireData = moment(user.phone_verify_token_expire);
    if (expireData.isBefore()) {
        throw new Error('Phone verify token is expired.');
    }

    const fields = {
        phone_verified: true,
        phone_verify_token: null,
        phone_verify_token_expire: null,
        status: constants.STATUS_ACTIVE,
        updated_at: moment().format('Y-M-D H:mm:ss'),
    };

    const result = await updateUser(user.id, fields);

    return get(result, 'data.update_users_by_pk') !== undefined;
}