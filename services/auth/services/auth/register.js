import { ValidationError } from "apollo-server-express";
import bcrypt from "bcryptjs";
import {v4 as uuidv4} from "uuid";
import gql from "graphql-tag";
import get from "lodash/get";
const moment = require('moment');

import * as constants from "../../helpers/values";
import { UserRegistrationFragment } from "../../fragments";
import { isEmail, isPhone, validateRegistration } from "../../validators";
import {
    getUserByEmail,
    getUserByPhone,
    getUserByUsername,
    hasuraQuery,
    sendEmailVerifyToken,
    sendSmsVerifyToken
} from "..";

export const register = async (username, emailOrPhone, password) => {
    const value = validateRegistration(username, emailOrPhone, password);
    emailOrPhone = value.email_or_phone;

    let user = await getUserByUsername(value.username);

    if (user) {
        throw new Error('Username already registered');
    }

    if (isEmail(emailOrPhone)) {
        user = await getUserByEmail(emailOrPhone);
    } else if (isPhone(emailOrPhone)) {
        user = await getUserByPhone(emailOrPhone);
    } else {
        throw new ValidationError('Wrong email or phone is given.');
    }

    if (user) {
        throw new Error('Username already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const params = {
        username: username.replace(/ /g, ''),
        email: isEmail(emailOrPhone) ? emailOrPhone : null,
        phone: isPhone(emailOrPhone) ? emailOrPhone : null,
        password: passwordHash,
        role: constants.ROLE_USER,
        secret_token: uuidv4() + '-' + (+new Date()),
        status: constants.STATUS_INACTIVE,
    };
    if (isEmail(emailOrPhone)) {
        params.email = emailOrPhone;
        params.email_verify_token = uuidv4() + '-' + (+new Date());
    } else {
        params.phone = emailOrPhone.replace(/^\++/, '');
        params.phone_verify_token = Math.floor(Math.random() * 99999) + 10000;
        params.phone_verify_token_expire = moment().add(5, 'minutes').format('Y-M-D H:mm:ss');
    }

    const result = await hasuraQuery(
        gql`
            ${UserRegistrationFragment}
            mutation ($user: users_insert_input!) {
                insert_users(objects: [$user]) {
                    returning {
                        ...User
                    }
                }
            }
        `,
        {
            user: params
        }
    );

    let data = get(result, 'data.insert_users.returning');
    if (data !== undefined && (data = data[0]) !== undefined) {
        if (data.email) {
            await sendEmailVerifyToken(data.username, data.email, data.email_verify_token);
        } else {
            await sendSmsVerifyToken(data.phone, data.phone_verify_token);
        }

        return true;
    }

    return false;
}