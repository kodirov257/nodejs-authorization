import { IResolvers } from '@graphql-tools/utils';

import { isAuthenticated, getCurrentUserId } from '../../core/helpers/user';
import {AddEmailService, ChangePasswordService, RefreshTokenService,} from './services';
import { ContextModel, User } from '../../core/models';
import { LoginForm, RegistrationForm } from './forms';
import { Register, LoginService } from './services';
import { getUserById } from './repositories';
import {AddPhoneService} from "./services/user/add-phone-service";

export class BasicAuth {
    protected hello() {
        return 'Hello world !';
    }

    protected auth_me = async (ctx: ContextModel): Promise<User|undefined> => {
        if (!isAuthenticated(ctx.req)) {
            throw new Error('Authorization token has not provided')
        }

        try {
            const currentUserId = getCurrentUserId(ctx.req);

            return await getUserById<User>(currentUserId);
        } catch (e: any) {
            throw new Error('Not logged in');
        }
    }

    protected register = async (args: RegistrationForm): Promise<boolean> => {
        const user: User = await (new Register(args.username, args.email_or_phone, args.password)).register();
        return !!user;
    }

    protected async login (args: LoginForm, ctx: ContextModel) {
        return (new LoginService(args.login, args.password, ctx)).signin();
    }

    protected change_password = async (oldPassword: string, newPassword: string, ctx: ContextModel) => {
        const user: User = await (new ChangePasswordService(oldPassword, newPassword, ctx)).changePassword();
        return !!user;
    }

    protected refresh_token = async (refreshToken: string, ctx: ContextModel) => {
        return (new RefreshTokenService(refreshToken, ctx)).refreshToken();
    }

    protected add_email = async (email: string, ctx: ContextModel) => {
        const user: User = await (new AddEmailService(email, ctx)).addEmail();
        return !!user;
    }

    protected add_phone = async (phone: string, ctx: ContextModel) => {
        const user: User = await (new AddPhoneService(phone, ctx)).addPhone();
        return !!user;
    }

    public resolvers(): IResolvers {
        return {
            Query: {
                hello: async (_: void, args: any, ctx: ContextModel) => this.hello(),
                auth_me: async (_: void, args: any, ctx: ContextModel) => this.auth_me(ctx),
            },
            Mutation: {
                auth_register: async (_: void, args: RegistrationForm, ctx: ContextModel) => this.register(args),
                auth_login: async (_: void, args: LoginForm, ctx: ContextModel) => this.login(args, ctx),
                change_password: async (_: void, args: {old_password: string, new_password: string}, ctx: ContextModel) =>
                    this.change_password(args.old_password, args.new_password, ctx),
                refresh_token: async (_: void, args: {refresh_token: string}, ctx: ContextModel) =>
                    this.refresh_token(args.refresh_token, ctx),
                add_email: async (_: void, args: {email: string}, ctx: ContextModel) => this.add_email(args.email, ctx),
                add_phone: async (_: void, args: {phone: string}, ctx: ContextModel) => this.add_phone(args.phone, ctx),
            }
        }
    }
}