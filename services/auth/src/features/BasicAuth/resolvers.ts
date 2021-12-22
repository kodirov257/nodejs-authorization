import { IResolvers } from '@graphql-tools/utils';

import {
    getCurrentUserId,
    isAuthenticated,
    getUserById,
} from './services';
import { LoginForm, RegistrationForm } from '../../core/forms';
import { ContextModel, User } from '../../core/models';
import { Register, Login } from './services';

export class BasicAuth {
    public hello() {
        return 'Hello world !';
    }

    public auth_me = async (ctx: ContextModel): Promise<User|undefined> => {
        if (!isAuthenticated(ctx.req)) {
            throw new Error('Authorization token has not provided')
        }

        try {
            const currentUserId = getCurrentUserId(ctx.req);

            return await getUserById(currentUserId);
        } catch (e: any) {
            throw new Error('Not logged in');
        }
    }

    public auth_register = async (args: RegistrationForm): Promise<boolean> => {
        const user: User = await (new Register(args.username, args.email_or_phone, args.password)).register();
        return !!user;
    }

    public async auth_login (args: LoginForm, ctx: ContextModel) {
        return (new Login(args.login, args.password, ctx)).signin();
    }

    public resolvers(): IResolvers {
        return {
            Query: {
                hello: async (_: void, args: any, ctx: ContextModel) => this.hello(),
                auth_me: async (_: void, args: any, ctx: ContextModel) => this.auth_me(ctx),
            },
            Mutation: {
                auth_register: async (_: void, args: RegistrationForm, ctx: ContextModel) => this.auth_register(args),
                auth_login: async (_: void, args: LoginForm, ctx: ContextModel) => this.auth_login(args, ctx),
            }
        }
    }
}