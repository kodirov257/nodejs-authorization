const moment = require('moment');
import { v4 as uuidv4 } from 'uuid';
import bcrypt from "bcryptjs";
import get from "lodash/get";

import {
    validateEmail,
    validatePhone,
    validateResetViaEmail,
    validateResetViaPhone,
} from "../../validators";
import { getUserByEmail, getUserByEmailVerifyToken, getUserByPhone, getUserByPhoneVerifyToken, updateUser } from "../index";
import { sendEmailResetToken } from "../mail";
import { sendSmsResetToken } from "../sms";

export const sendResetEmail = async (email) => {
    const value = validateEmail(email);
    email = value.email;

    let user = await getUserByEmail(email);

    if (!user) {
        throw new Error('Invalid email provided');
    }

    const fields = {
        email_verify_token: uuidv4() + '-' + (+new Date()),
    };

    const result = await updateUser(user.id, fields)

    let data = get(result, 'data.update_users_by_pk');

    if (data !== undefined) {
        await sendEmailResetToken(data.username, data.email, data.email_verify_token);

        return true;
    }

    return false;
}

export const sendResetPhone = async (phone) => {
    const value = validatePhone(phone);
    phone = value.phone

    let user = await getUserByPhone(phone);

    if (!user) {
        throw new Error('Invalid phone provided');
    }

    const fields = {
        phone_verify_token: (Math.floor(Math.random() * 90000) + 10000).toString(),
        phone_verify_token_expire: moment().add(5, 'minutes').format('Y-M-D H:mm:ss'),
    };

    const result = await updateUser(user.id, fields)

    let data = get(result, 'data.update_users_by_pk');

    if (data !== undefined) {
        await sendSmsResetToken(data.phone, data.phone_verify_token);

        return true;
    }

    return false;
}

export const resetViaEmail = async (token, password) => {
    validateResetViaEmail(token, password);

    let user = await getUserByEmailVerifyToken(token);

    if (!user) {
        throw new Error('Invalid token');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const fields = {
        email_verify_token: null,
        password: passwordHash,
    };

    const result = await updateUser(user.id, fields)

    return get(result, 'data.update_users_by_pk') !== undefined;
}

export const resetViaPhone = async (phone, token, password) => {
    validateResetViaPhone(phone, token, password);

    let user = await getUserByPhoneVerifyToken(phone);

    if (!user) {
        throw new Error('Invalid phone');
    }

    console.log(user.phone_verify_token);
    console.log(token);

    if (user.phone_verify_token !== token) {
        throw new Error('Invalid token');
    }

    const expireData = moment(user.phone_verify_token_expire);
    if (expireData.isBefore()) {
        throw new Error('Phone reset token is expired.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const fields = {
        phone_verify_token: null,
        phone_verify_token_expire: null,
        password: passwordHash,
    };

    const result = await updateUser(user.id, fields)

    return get(result, 'data.update_users_by_pk') !== undefined;
}
