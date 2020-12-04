import gql from "graphql-tag";
import {UserRegistrationFragment} from "../../fragments";
import get from "lodash/get";
const moment = require('moment');

import { validateEmail, validatePhone } from "../../validators";
import { getUserByEmail } from "../hasura/get-user";
import { sendEmailResetToken } from "../mail";
import { hasuraQuery } from "../client";

export const sendResetEmail = async (email) => {
    const value = validateEmail(email);
    email = value.email;

    let user = await getUserByEmail(email);

    if (!user) {
        throw new Error('Invalid email provided');
    }

    const result = await updateUser(user.id, 'email')

    let data = get(result, 'data.update_users_by_pk');

    if (data !== undefined) {
        await sendEmailResetToken(data);

        return true;
    }

    return false;
}

export const sendResetPhone = async (phone) => {
    const value = validatePhone(phone);
}

const updateUser = async (userId, attribute) => {
    let fields = {};
    if (attribute === 'email') {
        fields = {
            email_verify_token: uuidv4() + '-' + (+new Date()),
        };
    } else {
        fields = {
            phone_verify_token: Math.floor(Math.random() * 99999) + 10000,
            phone_verify_token_expire: moment().add(5, 'minutes').format('Y-M-D H:mm:ss'),
        };
    }

    return hasuraQuery(
        gql`
            ${UserRegistrationFragment}
            mutation ($user: users_set_input, $id: users_pk_columns_input!) {
                update_users_by_pk(_set: $user, pk_columns: $id) {
                    ...User
                }
            }
        `,
        {
            user: fields,
            id: {
                id: userId,
            }
        }
    );
}