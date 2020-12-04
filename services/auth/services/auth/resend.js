import gql from "graphql-tag";
import get from "lodash/get";

import { validateEmail, validatePhone } from "../../validators";
import { UserRegistrationFragment } from "../../fragments";
import { getUserByEmail } from "../hasura/get-user";
import { sendEmailVerifyToken } from "../mail";
import { hasuraQuery } from "../client";

export const resendEmail = async (email) => {
    const value = validateEmail(email);
    email = value.email;

    let user = await getUserByEmail(email);

    if (!user) {
        throw new Error('Invalid email provided');
    }

    const result = await hasuraQuery(
        gql`
            ${UserRegistrationFragment}
            mutation ($user: users_set_input, $id: users_pk_columns_input!) {
                update_users_by_pk(_set: $user, pk_columns: $id) {
                    ...User
                }
            }
        `,
        {
            user: {
                email_verified: false,
                email_verify_token: uuidv4() + '-' + (+new Date()),
            },
            id: {
                id: user.id,
            }
        }
    );

    let data = get(result, 'data.update_users_by_pk');

    if (data !== undefined) {
        await sendEmailVerifyToken(data);

        return true;
    }

    return false;
}

export const resendPhone = async (phone) => {
    const value = validatePhone(phone);
}