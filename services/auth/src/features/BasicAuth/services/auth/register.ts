import { ValidationError } from 'apollo-server-express';
import { DocumentNode } from 'graphql';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import gql from 'graphql-tag';

import { isEmail, isPhone, validateRegistration } from '../../../../core/validators';
import { ROLE_USER, STATUS_ACTIVE } from '../../../../core/helpers/values';
import { RegistrationForm, UserCreateForm } from '../../../../core/forms';
import { UserFragment } from '../../../../core/fragments';
import { hasuraQuery } from '../../../../core/services';
import { User } from '../../../../core/models';
import { GetUser } from '../hasura/get-user';

export class Register {
    private readonly username: string;
    private login: string;
    private readonly password: string;
    protected getUserService: GetUser;
    protected registerData: User|undefined;
    protected fragment: DocumentNode | undefined;

    public constructor(username: string, login: string, password: string) {
        this.username = username;
        this.login = login;
        this.password = password;
        this.fragment = UserFragment;

        this.getUserService = new GetUser();
    }

    protected validate = (): RegistrationForm => {
        return validateRegistration(this.username, this.login, this.password);
    }

    protected getUserByUsername = async (): Promise<User|undefined> => {
        return await this.getUserService.getUserByUsername(this.username, this.fragment);
    }

    protected getUserByEmail = async (): Promise<User|undefined> => {
        return await this.getUserService.getUserByEmail(this.login, this.fragment);
    }

    protected getUserByPhone = async (): Promise<User|undefined> => {
        return await this.getUserService.getUserByPhone(this.login, this.fragment);
    }

    protected getUser = async (): Promise<User|undefined> => {
        if (isEmail(this.login)) {
            return this.getUserByEmail();
        } else if (isPhone(this.login)) {
            return this.getUserByPhone();
        } else {
            throw new ValidationError('Wrong email or phone is given.')
        }
    }

    protected getParams = async (): Promise<UserCreateForm> => {
        const passwordHash = await bcrypt.hash(this.password, 10);

        return {
            username: this.username.replace(/ /g, ''),
            email: isEmail(this.login) ? this.login : null,
            phone: isPhone(this.login) ? this.login : null,
            password: passwordHash,
            role: ROLE_USER,
            secret_token: uuidv4() + '-' + (+new Date()),
            status: STATUS_ACTIVE,
        }
    }

    public register = async (): Promise<User> => {
        const value: RegistrationForm = this.validate();
        this.login = value.email_or_phone;

        let user: User|undefined = await this.getUserByUsername();
        if (user) {
            throw new Error('Username already registered');
        }

        user = await this.getUser();
        if (user) {
            throw new Error('Email or phone is already registered.')
        }

        const params = await this.getParams();

        const result = await hasuraQuery<{insert_auth_users?: { returning : User[] }}>(
            gql`
                ${this.fragment}
                mutation ($user: auth_users_insert_input!) {
                    insert_auth_users(objects: [$user]) {
                        returning {
                            ...User
                        }
                    }
                }
            `,
            {
                user: params,
            }
        );

        this.registerData = result.data?.insert_auth_users?.returning[0] ?? undefined;

        if (!this.registerData) {
            throw new Error('User is not registered.');
        }

        return this.registerData;
    }
}