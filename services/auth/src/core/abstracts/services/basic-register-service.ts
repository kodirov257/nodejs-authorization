import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';

import { hasuraQuery } from '../../helpers/client';
import { RegistrationForm } from '../../forms';
import {IRegisterServiceResolver} from "../../resolvers";

export abstract class BasicRegisterService<TUser, TUserCreateForm, TUserGetRepository> implements IRegisterServiceResolver<TUser> {
    protected readonly username: string;
    protected login: string;
    protected readonly password: string;
    protected userGetService: TUserGetRepository;
    protected registerData: TUser|undefined;
    protected fragment: DocumentNode;

    protected constructor(username: string, login: string, password: string, fragment: DocumentNode, userGetService: TUserGetRepository) {
        this.username = username;
        this.login = login;
        this.password = password;
        this.fragment = fragment;
        this.userGetService = userGetService;
    }

    protected abstract validateForm(): RegistrationForm;
    protected abstract getUserByUsername(): Promise<TUser|undefined>;
    protected abstract getUserByEmail(): Promise<TUser|undefined>;
    protected abstract getUserByPhone(): Promise<TUser|undefined>;
    protected abstract getUser(): Promise<TUser|undefined>;
    protected abstract getParams(): Promise<TUserCreateForm>;

    public async register(): Promise<TUser> {
        await this.validateUser();

        const params = await this.getParams();

        const result = await hasuraQuery<{insert_auth_users?: { returning : TUser[] }}>(
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

    protected async validateUser(): Promise<void> {
        const value: RegistrationForm = this.validateForm();
        this.login = value.email_or_phone;

        let user: TUser|undefined = await this.getUserByUsername();
        if (user) {
            throw new Error('Username already registered');
        }

        user = await this.getUser();
        if (user) {
            throw new Error('Email or phone is already registered.')
        }
    }
}