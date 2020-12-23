const moment = require('moment');
import { ValidationError } from "apollo-server-express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import gql from "graphql-tag";
import get from "lodash/get";

import * as constants from "../../helpers/values";
import { UserFragment } from "../../fragments";
import { isEmail, isPhone, validateRegistration } from "../../validators";
import {
    getUserByEmail,
    getUserByPhone,
    getUserByUsername,
    hasuraQuery,
    sendEmailVerifyToken,
    sendSmsVerifyToken
} from "../index";

export const register = async (username, emailOrPhone, password) => {
    const value = validateRegistration(username, emailOrPhone, password);
    emailOrPhone = value.emailOrPhone;

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

    let verificationParams = {};
    if (isEmail(emailOrPhone)) {
		verificationParams.email_verify_token = uuidv4() + '-' + (+new Date());
    } else {
		verificationParams.phone_verify_token = (Math.floor(Math.random() * 90000) + 10000).toString();
		verificationParams.phone_verify_token_expire = moment().add(5, 'minutes').format('Y-M-D H:mm:ss');
    }

	const params = {
		username: username.replace(/ /g, ''),
		email: isEmail(emailOrPhone) ? emailOrPhone : null,
		phone: isPhone(emailOrPhone) ? emailOrPhone.replace(/^\++/, '') : null,
		password: passwordHash,
		role: constants.ROLE_USER,
		secret_token: uuidv4() + '-' + (+new Date()),
		status: constants.STATUS_VERIFIED,
		user_verifications: {
			data: [verificationParams],
		},
	};

    const result = await hasuraQuery(
        gql`
            ${UserFragment}
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

    // console.log(result);
    // console.log(result.errors[0].extensions);
    // console.log(JSON.stringify(result));
    // console.log(result.errors[0].extensions.internal.statement);
    // console.log(result.errors[0]);

    let data = get(result, 'data.insert_users.returning');
    console.log(data, result);
    if (data !== undefined && (data = data[0]) !== undefined) {
    	const userVerificationData = data.user_verifications[0];
        if (data.email) {
            await sendEmailVerifyToken(data.username, data.email, userVerificationData.email_verify_token);
        } else {
            await sendSmsVerifyToken(data.phone, userVerificationData.phone_verify_token);
        }

        return true;
    }

    return false;
}
