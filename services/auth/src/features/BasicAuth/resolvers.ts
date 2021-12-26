import { IResolvers } from '@graphql-tools/utils';

import {
    getCurrentUserId,
    isAuthenticated,
} from './services';

import {
    getUserById,
} from './repositories';
import { ContextModel, User } from '../../core/models';
import { LoginForm, RegistrationForm } from './forms';
import { Register, LoginService } from './services';

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

    public resolvers(): IResolvers {
        return {
            Query: {
                hello: async (_: void, args: any, ctx: ContextModel) => this.hello(),
                auth_me: async (_: void, args: any, ctx: ContextModel) => this.auth_me(ctx),
            },
            Mutation: {
                auth_register: async (_: void, args: RegistrationForm, ctx: ContextModel) => this.register(args),
                auth_login: async (_: void, args: LoginForm, ctx: ContextModel) => this.login(args, ctx),
            }
        }
    }
}