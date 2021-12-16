import gql from 'graphql-tag';

import { UserFragment } from '../../fragments';
import { hasuraQuery } from '../client';
import { User } from '../../models';

export const getUserByUsername = async (username: string) => {
    return getUser('username', username);
}

export const getUserByEmail = async (email: string) => {
    return getUser('email', email);
}

export const getUserByPhone = async (phone: string) => {
    return getUser('phone', phone);
}

export const getUser = async (attribute: string, value: string): Promise<User|undefined> => {
    try {
        let condition: any = {};
        let where: any = {};
        where[attribute] = { _eq: value };
        condition.where = where;

        const response = await hasuraQuery<{auth_users: User[]}>(
            gql`
                ${UserFragment}
                query ($where: auth_users_bool_exp) {
                    auth_users(where: $where) {
                        ...User
                    }
                }
            `,
            condition,
        );

        return response.data?.auth_users[0];
    } catch (e: any) {
        throw new Error(e.message);
    }
}