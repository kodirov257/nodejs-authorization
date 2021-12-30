import bcrypt from 'bcryptjs';

import { IChangePasswordServiceResolver } from '../../../../core/resolvers';
import { BasicChangePasswordService } from '../../../../core/abstracts';
import { ContextModel, User } from '../../../../core/models';
import { getCurrentUserId, isAuthenticated } from '../user';
import { getUserById } from '../../../../core/repositories';
import { UserFragment } from '../../../../core/fragments';
import { updateUser } from '../../repositories';

export class ChangePasswordService extends BasicChangePasswordService<User> implements IChangePasswordServiceResolver<User> {
    constructor(oldPassword: string, newPassword: string, ctx: ContextModel) {
        super(oldPassword, newPassword, UserFragment, ctx);
    }

    protected async getUser(): Promise<User> {
        if (!isAuthenticated(this.ctx.req)) {
            throw new Error('Authorization token has not provided.');
        }

        const currentUserId: string = getCurrentUserId(this.ctx.req);
        const user: User|undefined = await getUserById<User>(currentUserId, this.userFragment);

        if (!user) {
            throw new Error('User is not found.');
        }

        return user;
    }

    protected async change(user: User): Promise<User> {
        const passwordMatch: boolean = await bcrypt.compare(this.oldPassword, user.password);

        if (!passwordMatch) {
            throw new Error('Invalid "password".');
        }

        const passwordHash: string = await bcrypt.hash(this.newPassword, 10);
        const fields = {
            password: passwordHash,
        }

        const result: User|undefined = await updateUser(user.id, fields);
        if (!result) {
            throw new Error('Password is not changed.');
        }

        return result;
    }

}