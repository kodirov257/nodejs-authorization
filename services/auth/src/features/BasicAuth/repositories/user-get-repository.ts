import { DocumentNode } from 'graphql';

import { BasicUserGetRepository } from '../../../core/abstracts';
import { STATUS_ACTIVE } from '../../../core/helpers/values';
import { isEmail, isPhone } from '../../../core/validators';
import { UserFragment } from '../fragments';
import { User } from '../../../core/models';

export class UserGetRepository extends BasicUserGetRepository {
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
            throw new Error('Invalid "login" or "password"');
        }

        if (user.status !== STATUS_ACTIVE) {
            throw new Error('User not activated.');
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

    public getUser = async (attribute: string, value: string, fragment: DocumentNode = UserFragment): Promise<User|undefined> => {
        return this.getUserBase<User>(attribute, value, fragment);
    }
}