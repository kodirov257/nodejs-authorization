import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';

import { UserFragment, UserVerificationFragment } from '../fragments';
import { BasicUserGetRepository } from '../../../core/abstracts';
import { isEmail, isPhone } from '../../../core/validators';
import { getUserById } from '../../BasicAuth/repositories';
import { hasuraQuery } from '../../../core/helpers/client';
import { User, UserVerification } from '../models';
import * as constants from '../helpers/values';

export class UserGetRepository extends BasicUserGetRepository {
    public async getUserByCredentials(usernameEmailOrPhone: string, password: string): Promise<User> {
        let user: User|undefined;
        let userVerification: UserVerification;
        let searchType: string;

        if (isEmail(usernameEmailOrPhone)) {
            searchType = 'email';
            user = await this.getUserByEmail(usernameEmailOrPhone);
        } else if (isPhone(usernameEmailOrPhone)) {
            searchType = 'phone';
            user = await this.getUserByPhone(usernameEmailOrPhone);
        } else {
            searchType = 'username';
            user = await this.getUserByUsername(usernameEmailOrPhone);
        }

        if (!user || !user.user_verifications || !(userVerification = user?.user_verifications[0])) {
            throw new Error('Invalid "email" or "password"');
        }

        if (user.status !== constants.STATUS_ACTIVE && user.status === constants.STATUS_INACTIVE) {
            throw new Error('User not activated.');
        }

        if (user.status === constants.STATUS_VERIFIED
            && (
                (searchType === 'username' && (!userVerification.phone_verified || !userVerification.email_verified))
                || (searchType === 'email' && !userVerification.email_verified)
                || (searchType === 'phone' && !userVerification.phone_verified)
            )
        ) {
            throw new Error('User need to be verified.');
        }

        await this.matchPassword(password, user.password);

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

    public override getUser = async (attribute: string, value: string, fragment: DocumentNode = UserFragment): Promise<User|undefined> => {
        return this.getUserBase<User>(attribute, value, fragment);
    }

    public getUserByPhoneVerifyToken = async (phone: string) => {
        return this.getUser('phone', phone.replace(/^\++/, ''), UserFragment);
    }

    public getUserByEmailVerifyToken = async (token: string) => {
        const userVerification = await this.getUserVerification('email_verify_token', token);
        if (!userVerification) {
            throw new Error('Wrong token is provided.');
        }
        return getUserById<User>(userVerification.user_id, UserFragment);
    }

    protected getUserVerification = async (attribute: string, value: string, fragment: DocumentNode = UserVerificationFragment): Promise<UserVerification|undefined> => {
        try {
            let condition: any = {};
            let where: any = {};
            where[attribute] = { _eq: value };
            condition.where = where;
            const response = await hasuraQuery<{auth_user_verifications: UserVerification[]}>(
                gql`
                    ${fragment}
                    query ($where: auth_user_verifications_bool_exp) {
                        auth_user_verifications(where: $where) {
                            ...UserVerification
                        }
                    }
                `,
                condition
            );

            return response.data?.auth_user_verifications[0];
        } catch (e: any) {
            if (e instanceof Error) {
                throw new Error(e.message);
            }
            throw new Error('Internal error.');
        }
    }
}