import bcrypt from 'bcryptjs';
import gql from 'graphql-tag';

import { STATUS_ACTIVE } from '../../../../core/helpers/values';
import { isEmail, isPhone } from '../../../../core/validators';
import { UserFragment } from '../../../../core/fragments';
import { hasuraQuery } from '../../../../core/services';
import { User } from '../../../../core/models';
import {DocumentNode} from "graphql";

export class GetUser {
    public async getUserByCredentials(usernameEmailOrPhone: string, password: string): Promise<User> {
        let user: User|undefined;

        if (isEmail(usernameEmailOrPhone)) {
            user = await this.getUserByEmail(usernameEmailOrPhone);
        } else if (isPhone(usernameEmailOrPhone)) {
            user = await this.getUserByPhone(usernameEmailOrPhone);
        } else {
            user = await this.getUserByUsername(usernameEmailOrPhone);
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

    public getUserByUsername = async (username: string, fragment: DocumentNode = UserFragment) => {
        return this.getUser('username', username, fragment);
    }

    public getUserByEmail = async (email: string, fragment: DocumentNode = UserFragment) => {
        return this.getUser('email', email, fragment);
    }

    public getUserByPhone = async (phone: string, fragment: DocumentNode = UserFragment) => {
        return this.getUser('phone', phone, fragment);
    }

     getUser = async (attribute: string, value: string, fragment: DocumentNode = UserFragment): Promise<User|undefined> => {
        try {
            let condition: any = {};
            let where: any = {};
            where[attribute] = { _eq: value };
            condition.where = where;

            const response = await hasuraQuery<{auth_users: User[]}>(
                gql`
                    ${fragment}
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
}