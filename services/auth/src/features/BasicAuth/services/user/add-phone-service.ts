import {AddEmailServiceResolver, AddPhoneServiceResolver} from '../../../../core/resolvers';
import { ContextModel, User } from '../../../../core/models';
import {validateEmail, validatePhone} from '../../../../core/validators';
import { AddInfoService } from './add-info-service';

export class AddPhoneService extends AddInfoService implements AddPhoneServiceResolver<User> {
    constructor(phone: string, ctx: ContextModel) {
        super({phone, type: 'phone'}, ctx);
    }

    public addPhone = async (): Promise<User> => {
        validatePhone(this.phone, 'Failed to validate phone.');

        return this.addInfo();
    }

    protected checkParametersExist = async (user: User): Promise<void> => {
        const anotherUser = await this.userGetRepository.getUserByPhone(this.phone ?? '');

        if (anotherUser && anotherUser.id !== user.id) {
            throw new Error(`There is already active user with this ${this.type}.`);
        }
    }
}