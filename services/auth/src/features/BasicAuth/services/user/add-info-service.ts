import { DocumentNode } from 'graphql';

import { BasicAddInfoService } from '../../../../core/abstracts/services/basic-add-info-service';
import { getUserById, updateUser, UserGetRepository } from '../../repositories';
import { getCurrentUserId } from '../../../../core/helpers/user';
import * as constants from '../../../../core/helpers/values';
import { ContextModel, User } from '../../../../core/models';
import { UserFragment } from '../../../../core/fragments';

export abstract class AddInfoService extends BasicAddInfoService<User> {
    protected readonly userGetRepository: UserGetRepository;

    protected constructor(args: {email?: string, phone?: string, type?: string}, ctx: ContextModel) {
        super(args, ctx);
        this.userGetRepository = new UserGetRepository();
    }

    protected getUser = async (userId: string, fragment: DocumentNode = this.getUserFragment()): Promise<User> => {
        const user: User|undefined = await getUserById<User>(userId, fragment);

        if (!user) {
            throw new Error('User not found.');
        }

        if (user.status !== constants.STATUS_ACTIVE) {
            throw new Error('User not activated.');
        }

        return user;
    }

    protected getUserFragment = (): DocumentNode => {
        return UserFragment;
    }

    protected sendAddInfo = async (user: User, type: string): Promise<User> => {
        const {userData} = await this.updateAddInfo(user);
        return userData;
    }

    protected validateAddInfo = async (user: User, type: string): Promise<boolean> => {
        if (this.type === 'email' && user.email) {
            throw new Error('Email is already set.');
        } else if (this.type === 'phone' && user.phone) {
            throw new Error('Phone number is already set.');
        }
        return Promise.resolve(true);
    }

    protected updateAddInfo = async (user: User): Promise<{ userData: User }> => {
        const _fields = {
            emailFields: { email: this.email},
            phoneFields: { phone: this.phone},
        };

        const result = await updateUser(user.id, _fields[this.type === 'email' ? 'emailFields' : 'phoneFields']);
        if (!result) {
            throw new Error(`${this.type} is not added.`);
        }
        return {userData: result};
    }

}