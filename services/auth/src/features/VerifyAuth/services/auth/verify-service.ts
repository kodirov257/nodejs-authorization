import moment from 'moment';

import { validateVerifyEmail, validateVerifyPhone } from '../../validators';
import { ContextModel, GeneratorModel } from '../../../../core/models';
import * as constants from '../../../../core/helpers/values';
import { UserGetRepository } from '../../repositories';
import { GeneratorService } from './generator-service';
import { User, UserVerification } from '../../models';
import { updateUser } from '../../repositories';
import { VerificationForm } from '../../forms';

export class VerifyService {
    private readonly generator: GeneratorService;
    private readonly userGet: UserGetRepository;
    private readonly token: string;
    private readonly phone: string|null;
    private readonly ctx: ContextModel;

    public constructor({token, phone = null}: {token: string, phone?: string|null}, ctx: ContextModel) {
        this.generator = new GeneratorService();
        this.userGet = new UserGetRepository();
        this.token = token;
        this.phone = phone ? phone.replace(/^\++/, '') : null;
        this.ctx = ctx;
    }

    public async verifyEmail(): Promise<GeneratorModel|boolean> {
        validateVerifyEmail(this.token);

        let user: User|undefined = await this.userGet.getUserByEmailVerifyToken(this.token);

        if (!user) {
            throw new Error('Invalid token.');
        }

        return this.verify(user, 'email');
    }

    public async verifyPhone(): Promise<GeneratorModel|boolean> {
        validateVerifyPhone(this.phone, this.token);

        if (!this.phone) {
            throw new Error('No phone is provided.')
        }

        let user = await this.userGet.getUserByPhoneVerifyToken(this.phone); // TODO: add token

        if (!user) {
            throw new Error('Invalid phone.');
        }

        return this.verify(user, 'phone');
    }

    protected async verify(user: User, type: string = 'email'): Promise<GeneratorModel|boolean> {
        this.validate(user, type);

        const fields = {
            status: constants.STATUS_ACTIVE,
            updated_at: moment().format('Y-M-D H:mm:ss'),
        }

        const _verificationFields: VerificationForm = {
            emailFields: {
                email_verified: true,
                email_verify_token: null,
            },
            phoneFields: {
                phone_verified: true,
                phone_verify_token: null,
                phone_verify_token_expire: null,
            },
        };

        const result = await updateUser(user.id, fields, _verificationFields[type === 'phone' ? 'phoneFields' : 'emailFields']);

        if (result.user && result.verification) {
            return this.generator.generateTokens(user, this.ctx.req, this.ctx.res);
        }

        return this.revertChanges(user, user.user_verifications[0], type);
    }

    private validate = (user: User, type: string = 'email'): void => {
        this.validateType(type);

        const userVerification = user.user_verifications[0];

        if (!userVerification) {
            throw new Error('No user verification is provided.');
        }

        if (type === 'phone') {
            if (userVerification.phone_verify_token !== this.token) {
                throw new Error('Invalid token.');
            }

            const expireData = moment(userVerification.phone_verify_token_expire);
            if (expireData.isBefore()) {
                throw new Error('Phone verify token is expired.');
            }
        }
    }

    private async revertChanges(user: User, verfication: UserVerification, type: string = 'email'): Promise<boolean> {
        this.validateType(type);

        const _fields: VerificationForm = {
            emailFields: {
                email_verified: verfication.email_verified,
                email_verify_token: verfication.email_verify_token,
            },
            phoneFields: {
                phone_verified: verfication.phone_verified,
                phone_verify_token: verfication.phone_verify_token,
                phone_verify_token_expire: verfication.phone_verify_token_expire,
            },
        };

        await updateUser(user.id, { status: user.status, updated_at: moment().format('Y-M-D H:mm:ss') },
            _fields[type === 'email' ? 'emailFields' : 'phoneFields']);

        return false;
    }

    private validateType = (type: string): void => {
        if (!['email', 'phone'].includes(type)) {
            throw new Error('Wrong type is provided.')
        }
    }
}