import { DocumentNode } from 'graphql';
import bcrypt from 'bcryptjs';
import gql from 'graphql-tag';

import { hasuraQuery } from '../../helpers/client';
import { UserFragment } from '../../fragments';

export abstract class BasicUserGetRepository {
    public abstract getUserByCredentials(usernameEmailOrPhone: string, password: string): Promise<any>;
    public abstract getUserByUsername(username: string, fragment: DocumentNode): Promise<any>;
    public abstract getUserByEmail(email: string, fragment: DocumentNode): Promise<any>;
    public abstract getUserByPhone(phone: string, fragment: DocumentNode): Promise<any>;
    public abstract getUser(attribute: string, value: string, fragment: DocumentNode): Promise<any>;

    protected matchPassword = async (password: string, userPassword: string): Promise<void> => {
        const passwordMatch = await bcrypt.compare(password, userPassword);

        if (!passwordMatch) {
            throw new Error('Invalid "login" or "password"');
        }
    }

    protected getUserBase = async <T>(attribute: string, value: string, fragment: DocumentNode = UserFragment): Promise<T|undefined> => {
        try {
            let condition: any = {};
            let where: any = {};
            where[attribute] = { _eq: value };
            condition.where = where;

            const response = await hasuraQuery<{auth_users: T[]}>(
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