import gql from 'graphql-tag';

import { UserFragment } from '../../fragments';
import { hasuraQuery } from '../client';

export const getUserById = async (id, fragment = UserFragment) => {
    try {
        const response = await hasuraQuery(
            gql`
                ${fragment}
                query($id: bigint!) {
                    users_by_pk(id: $id) {
                        ...User
                    }
                }
            `,
            { id },
        );

        return response.data.users_by_pk || undefined;
    } catch (e) {
        throw new Error('Unable to find the user');
    }
};
