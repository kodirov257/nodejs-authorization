import { validateResendEmail, validateResendPhone } from "../../validators";
import { getUserByEmail } from "../hasura/get-user";
import {hasuraQuery} from "../client";
import gql from "graphql-tag";
import {UserRegistrationFragment} from "../../fragments";
import * as constants from "../../helpers/values";
import get from "lodash/get";

export const resendEmail = async (email) => {
    const value = validateResendEmail(email);
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

    return get(result, 'data.update_users_by_pk') !== undefined;
}

export const resendPhone = async (phone) => {
    const value = validateResendPhone(phone);
}