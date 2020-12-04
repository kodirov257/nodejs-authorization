import gql from "graphql-tag";
import get from "lodash/get";
import { v4 as uuidv4 } from 'uuid';

import { validateEmail, validatePhone } from "../../validators";
import { UserRegistrationFragment } from "../../fragments";
import { getUserByEmail } from "../hasura/get-user";
import { sendEmailVerifyToken } from "../mail";
import { hasuraQuery } from "../client";
import {updateUser} from "../hasura/update-user";

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

    const result = updateUser(user.id, fields);

    let data = get(result, 'data.update_users_by_pk');

    if (data !== undefined) {
        await sendEmailVerifyToken(data.username, data.email, data.email_verify_token);

        return true;
    }

    return false;
}

export const resendPhone = async (phone) => {
    const value = validatePhone(phone);
}