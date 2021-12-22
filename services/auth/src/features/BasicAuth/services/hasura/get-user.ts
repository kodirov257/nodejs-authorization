import gql from 'graphql-tag';

import { STATUS_ACTIVE } from '../../../../core/helpers/values';
import { isEmail, isPhone } from '../../../../core/validators';
import { UserFragment } from '../../../../core/fragments';
import { hasuraQuery } from '../../../../core/services';
import { User } from '../../../../core/models';
import bcrypt from "bcryptjs";

export async function getUserByCredentials(usernameEmailOrPhone: string, password: string): Promise<User> {
    let user: User|undefined;
    if (isEmail(usernameEmailOrPhone)) {
        user = await getUserByEmail(usernameEmailOrPhone);
    } else if (isPhone(usernameEmailOrPhone)) {
        user = await getUserByPhone(usernameEmailOrPhone);
    } else {
        user = await getUserByUsername(usernameEmailOrPhone);
    }

    if (!user) {
        throw new Error('Invalid "email" or "password"');
    }

    if (user.status !== STATUS_ACTIVE) {
        throw new Error('User not activated.');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        throw new Error('Invalid "email" or "password"');
    }

    return user;
}

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