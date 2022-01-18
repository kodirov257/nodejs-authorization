import { IResolvers } from '@graphql-tools/utils';

import {ChangePasswordService, LoginService, RegisterService, ResendService, VerifyService} from './services';
import { ResetPasswordService } from './services/auth/reset-password-service';
import { ContextModel, GeneratorModel, User } from '../../core/models';
import { RegistrationForm } from '../../core/forms';
import { BasicAuth } from '../BasicAuth/resolvers';
import { LoginForm } from '../BasicAuth/forms';

export class VerifyAuth extends BasicAuth {
    private registerService: typeof RegisterService;
    private verifyService: typeof VerifyService;
    private signinService: typeof LoginService;
    private resendService: typeof ResendService;
    private resetService: typeof ResetPasswordService;
    private changePasswordService: typeof ChangePasswordService;

    constructor() {
        super();

        this.registerService = RegisterService;
        this.verifyService = VerifyService;
        this.signinService = LoginService;
        this.resendService = ResendService;
        this.resetService = ResetPasswordService;
        this.changePasswordService = ChangePasswordService;
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

    protected send_reset_email = async (email: string, ctx: ContextModel) => {
        return (new this.resetService(ctx)).sendResetEmail(email);
    }

    protected send_reset_phone = async (phone: string, ctx: ContextModel) => {
        return (new this.resetService(ctx)).sendResetPhone(phone);
    }

    reset_via_email = async (args: {token: string, password: string}, ctx: ContextModel) => {
        const accessToken: GeneratorModel|boolean = await (new this.resetService(ctx)).resetViaEmail(args.token, args.password);
        return !!accessToken;
    }

    reset_via_phone = async (args: {phone: string, token: string, password: string}, ctx: ContextModel) => {
        const accessToken: GeneratorModel|boolean = await (new this.resetService(ctx)).resetViaPhone(args.phone, args.token, args.password);
        return !!accessToken;
    }

    protected override change_password = async (oldPassword: string, newPassword: string, ctx: ContextModel) => {
        const user: User = await (new this.changePasswordService(oldPassword, newPassword, ctx)).changePassword();
        return !!user;
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
                send_reset_email: async (_: void, args: {email: string}, ctx: ContextModel) =>
                    this.send_reset_email(args.email, ctx),
                send_reset_phone: async (_: void, args: {phone: string}, ctx: ContextModel) =>
                    this.send_reset_phone(args.phone, ctx),
                reset_via_email: async (_: void, args: {token: string, password: string}, ctx: ContextModel) =>
                    this.reset_via_email(args, ctx),
                reset_via_phone: async (_: void, args: {phone: string, token: string, password: string}, ctx: ContextModel) =>
                    this.reset_via_phone(args, ctx),
                change_password: async (_: void, args: {old_password: string, new_password: string}, ctx: ContextModel) =>
                    this.change_password(args.old_password, args.new_password, ctx),
                refresh_token: async (_: void, args: {refresh_token: string}, ctx: ContextModel) =>
                    this.refresh_token(args.refresh_token, ctx),
            }
        }
    }
}