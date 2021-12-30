import { IChangePasswordServiceResolver } from '../../resolvers';
import { ContextModel } from '../../models';
import {DocumentNode} from "graphql";
import {validateChangePassword} from "../../validators";

export abstract class BasicChangePasswordService<TUser> implements IChangePasswordServiceResolver<TUser> {
    protected readonly oldPassword: string;
    protected readonly newPassword: string;
    protected readonly ctx: ContextModel;
    protected readonly userFragment: DocumentNode;

    protected constructor(oldPassword: string, newPassword: string, userFragment: DocumentNode, ctx: ContextModel) {
        this.oldPassword = oldPassword;
        this.newPassword = newPassword;
        this.userFragment = userFragment;
        this.ctx = ctx;
    }

    protected abstract getUser(): Promise<TUser>;
    protected abstract change(user: TUser): Promise<TUser>;

    public async changePassword(): Promise<TUser> {
        const user: TUser = await this.getUser();
        validateChangePassword(this.oldPassword, this.newPassword);

        if (this.oldPassword === this.newPassword) {
            throw new Error('Old password and new password are identical.');
        }

        return this.change(user);
    }
}