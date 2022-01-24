import { ValidationError } from 'apollo-server-express';
import { DocumentNode } from 'graphql';

import { getCurrentUserId, isAuthenticated } from '../../helpers/user';
import { ContextModel } from '../../models';

export abstract class BasicAddInfoService<TUser> {
    protected ctx: ContextModel;
    protected phone: string|null;
    protected readonly email: string|null;
    protected readonly type: string;

    protected constructor(args: {email?: string, phone?: string, type?: string}, ctx: ContextModel) {
        this.email = args.email ?? null;
        this.phone = args.phone ? args.phone.replace(/^\++/, '') : null;
        this.type = args.type ?? 'email';
        this.ctx = ctx;
    }

    protected addInfo = async (): Promise<TUser> => {
        if (!isAuthenticated(this.ctx.req)) {
            throw new Error('Authorization token has not provided');
        }

        const currentUserId: string = getCurrentUserId(this.ctx.req);

        const user: TUser = await this.getUser(currentUserId, this.getUserFragment());

        let validateData: boolean = await this.validateAddInfo(user, this.type);
        if (!validateData) {
            throw new ValidationError('Wrong parameters provided.');
        }

        await this.checkParametersExist(user);

        return this.sendAddInfo(user, this.type);
    }

    protected abstract getUser(userId: string, fragment: DocumentNode): Promise<TUser>;

    protected abstract validateAddInfo(user: TUser, type: string): Promise<boolean>;

    protected abstract getUserFragment(): DocumentNode;

    protected abstract checkParametersExist(user: TUser): Promise<void>;

    protected abstract sendAddInfo(user: TUser, type: string): Promise<TUser>;

    protected abstract updateAddInfo(user: TUser): Promise<{userData: TUser, verificationData?: any}>;
}