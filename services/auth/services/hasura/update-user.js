import gql from "graphql-tag";
const moment = require('moment');

import { UserRegistrationFragment } from "../../fragments";
import { hasuraQuery } from "../client";

export const updateUser = async (userId, fields) => {
    fields.updated_at = moment().format('Y-M-D H:mm:ss');
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