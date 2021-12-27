import { IResolvers } from '@graphql-tools/utils';

import {LoginService, RegisterService, ResendService, VerifyService} from './services';
import { ContextModel, GeneratorModel, User } from '../../core/models';
import { RegistrationForm } from '../../core/forms';
import { BasicAuth } from '../BasicAuth/resolvers';
import { LoginForm } from '../BasicAuth/forms';

export class VerifyAuth extends BasicAuth {
    private registerService: typeof RegisterService;
    private verifyService: typeof VerifyService;
    private signinService: typeof LoginService;
    private resendService: typeof ResendService;

    constructor() {
        super();

        this.registerService = RegisterService;
        this.verifyService = VerifyService;
        this.signinService = LoginService;
        this.resendService = ResendService;
    }

    protected override register = async (args: RegistrationForm): Promise<boolean> => {
        const user: User = await (new this.registerService(args.username, args.email_or_phone, args.password)).register();
        return !!user;
    }

    protected verify_email = async (token: string, ctx: ContextModel): Promise<GeneratorModel|boolean> => {
        return (new this.verifyService({token}, ctx)).verifyEmail();
    }

    protected verify_phone = async (phone: string, token: string, ctx: ContextModel): Promise<GeneratorModel|boolean> => {
        return (new this.verifyService({token, phone}, ctx)).verifyPhone();
    }

    protected resend_email = async (email: string): Promise<boolean> => {
        return (new this.resendService({email})).resendEmail();
    }

    protected resend_phone = async (phone: string): Promise<boolean> => {
        return (new this.resendService({phone})).resendPhone();
    }

    protected override async login (args: LoginForm, ctx: ContextModel) {
        return (new this.signinService(args.login, args.password, ctx)).signin();
    }

    public override resolvers(): IResolvers {
        return {
            Query: {
                hello: async (_: void, args: any, ctx: ContextModel) => this.hello(),
                auth_me: async (_: void, args: any, ctx: ContextModel) => this.auth_me(ctx),
            },
            Mutation: {
                auth_register: async (_: void, args: RegistrationForm, ctx: ContextModel) =>
                    this.register(args),
                verify_email: async (_: void, args: {token: string}, ctx: ContextModel) =>
                    this.verify_email(args.token, ctx),
                verify_phone: async (_: void, args: {phone: string, token: string}, ctx: ContextModel) =>
                    this.verify_phone(args.phone, args.token, ctx),
                resend_email: async (_: void, args: {email: string}, ctx: ContextModel) =>
                    this.resend_email(args.email),
                resend_phone: async (_: void, args: {phone: string}, ctx: ContextModel) =>
                    this.resend_phone(args.phone),
                auth_login: async (_: void, args: LoginForm, ctx: ContextModel) =>
                    this.login(args, ctx),
            }
        }
    }
}