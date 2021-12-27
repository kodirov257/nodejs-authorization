import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';

import { hasuraQuery } from '../helpers/client';
import { UserFragment } from '../fragments';

export const getUserById = async <T>(id: string, fragment: DocumentNode = UserFragment): Promise<T|undefined> => {
    const response = await hasuraQuery<{auth_users_by_pk: T}>(
        gql`
            ${fragment}
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