const moment = require('moment');
import get from "lodash/get";

import { validateVerifyEmail, validateVerifyPhone } from "../../validators";
import { getUserByEmailVerifyToken, getUserByPhoneVerifyToken, updateUser } from "../index";
import * as constants from "../../helpers/values";

export const verifyEmail = async (token) => {
    validateVerifyEmail(token);

    let user = await getUserByEmailVerifyToken(token);

    if (!user) {
        throw new Error('Invalid token');
    }

    const userVerifications = user.user_verifications[0];

    const fields = {
        status: constants.STATUS_ACTIVE,
        updated_at: moment().format('Y-M-D H:mm:ss'),
    };

    const verificationFields = {
        email_verified: true,
        email_verify_token: null,
    };

    const result = await updateUser(user.id, fields, verificationFields);

    if (get(result, 'data.update_users_by_pk') !== undefined && get(result, 'data.update_user_verifications_by_pk') !== undefined) {
        return true;
    }

    await updateUser(user.id, {status: user.status, updated_at: moment().format('Y-M-D H:mm:ss')}, {
        email_verified: userVerifications ? userVerifications.email_verified : false,
        email_verify_token: userVerifications ? userVerifications.email_verify_token : null,
    });

    return false;
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
        status: constants.STATUS_ACTIVE,
        updated_at: moment().format('Y-M-D H:mm:ss'),
    };

    const userVerificationFields = {
        phone_verified: true,
        phone_verify_token: null,
        phone_verify_token_expire: null,
    };

    const result = await updateUser(user.id, fields, userVerificationFields);

    if (get(result, 'data.update_users_by_pk') !== undefined && get(result, 'data.update_user_verifications_by_pk') !== undefined) {
        return true;
    }

    return get(result, 'data.update_users_by_pk') !== undefined;
}
