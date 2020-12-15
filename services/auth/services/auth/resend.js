const moment = require('moment');
import get from "lodash/get";
import { v4 as uuidv4 } from 'uuid';

import { validateEmail, validatePhone } from "../../validators";
import {getUserByEmail, getUserByPhone} from "../hasura/get-user";
import { sendEmailVerifyToken } from "../mail";
import { updateUser } from "../hasura/update-user";
import { sendSmsVerifyToken } from "../sms";

export const resendEmail = async (email) => {
    const value = validateEmail(email);
    email = value.email;

    let user = await getUserByEmail(email);

    if (!user) {
        throw new Error('Invalid email provided');
    }

    const fields = {
        email_verified: false,
        email_verify_token: uuidv4() + '-' + (+new Date()),
    };

    const result = await updateUser(user.id, fields);

    let data = get(result, 'data.update_users_by_pk');

    if (data !== undefined) {
        await sendEmailVerifyToken(data.username, data.email, data.email_verify_token);

        return true;
    }

    return false;
}

export const resendPhone = async (phone) => {
    const value = validatePhone(phone);
    phone = value.phone

    let user = await getUserByPhone(phone);

    if (!user) {
        throw new Error('Invalid phone provided');
    }

    const fields = {
        phone_verified: false,
        phone_verify_token: (Math.floor(Math.random() * 99999) + 10000).toString(),
        phone_verify_token_expire: moment().add(5, 'minutes').format('Y-M-D H:mm:ss'),
    };

    const result = await updateUser(user.id, fields)

    let data = get(result, 'data.update_users_by_pk');

    if (data !== undefined) {
        await sendSmsVerifyToken(data.phone, data.phone_verify_token);

        return true;
    }

    return false;
}