import { hasuraQuery } from '../client';
import { UserFragment } from '../../fragments';
import gql from 'graphql-tag';

export const getUserById = async (id) => {
    try {
        const response = await hasuraQuery(
            gql`
                ${UserFragment}
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