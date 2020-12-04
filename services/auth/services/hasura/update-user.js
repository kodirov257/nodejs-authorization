import gql from "graphql-tag";

import { UserRegistrationFragment } from "../../fragments";
import { hasuraQuery } from "../client";

export const updateUser = async (userId, fields) => {
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