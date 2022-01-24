import { AddEmailServiceResolver } from '../../../../core/resolvers';
import { ContextModel, User } from '../../../../core/models';
import { validateEmail } from '../../../../core/validators';
import { AddInfoService } from './add-info-service';

export class AddEmailService extends AddInfoService implements AddEmailServiceResolver<User> {
    constructor(email: string, ctx: ContextModel) {
        super({email: email, type: 'email'}, ctx);
    }

    public addEmail = async (): Promise<User> => {
        console.log(`Email: ${this.email}`);
        validateEmail(this.email, 'Failed to validate email.');

        return this.addInfo();
    }

    protected checkParametersExist = async (user: User): Promise<void> => {
        const anotherUser = await this.userGetRepository.getUserByEmail(this.email ?? '');

        if (anotherUser && anotherUser.id !== user.id) {
            throw new Error(`There is already active user with this ${this.type}.`);
        }
    }
}