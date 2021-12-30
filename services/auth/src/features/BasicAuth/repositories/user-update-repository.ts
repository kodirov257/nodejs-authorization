import gql from 'graphql-tag';
import moment from 'moment';

import { hasuraQuery } from '../../../core/helpers/client';
import { UserFragment } from '../fragments';
import { User } from '../models';

export const updateUser = async (userId: string, fields: any) => {
    fields.updated_at = moment().format('Y-M-D H:mm:ss');

    try {
        const result = await hasuraQuery<{
            update_auth_users_by_pk: User|undefined,
        }>(
            gql`
                ${UserFragment}
                mutation ( $user: auth_users_set_input, $id: auth_users_pk_columns_input!) {
                    update_auth_users_by_pk(_set: $user, pk_columns: $id) {
                        ...User
                    }
                }
            `,
            {
                user: fields,
                id: {
                    id: userId,
                },
            }
        );

        const user = result.data?.update_auth_users_by_pk;

        return user;
    } catch (e: any) {
        if (e instanceof Error) {
            throw new Error(e.message);
        }
        throw new Error('Internal error.');
    }
}