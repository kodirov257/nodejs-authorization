import gql from 'graphql-tag';

import { UserFragment } from '../../../../core/fragments';
import { hasuraQuery } from '../../../../core/services';
import { User } from '../../../../core/models';

export const getUserById = async (id: string) => {
    const response = await hasuraQuery<{auth_users_by_pk: User}>(
        gql`
            ${UserFragment}
            query ($id: uuid!) {
                auth_users_by_pk(id: $id) {
                    ...User
                }
            }
        `,
        { id },
    );

    return response.data?.auth_users_by_pk || undefined;
}