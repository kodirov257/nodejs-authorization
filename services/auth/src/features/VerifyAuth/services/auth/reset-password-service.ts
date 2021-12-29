import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import moment from 'moment';

import { validateEmail, validatePhone, validateResetViaEmail, validateResetViaPhone } from '../../validators';
import { ResetViaEmailModel, ResetViaPhoneModel } from '../../../BasicAuth/models';
import { IResetPasswordServiceResolver } from '../../../../core/resolvers';
import { ContextModel, GeneratorModel } from '../../../../core/models';
import { ResetPasswordForm } from '../../forms/reset-password--form';
import { updateUser, UserGetRepository } from '../../repositories';
import { Mail } from '../../../BasicAuth/services/mail';
import { GeneratorService } from './generator-service';
import { User, UserVerification } from '../../models';
import { Sms } from '../../../BasicAuth/services/sms';
import { UserFragment } from '../../fragments';
import { VerificationForm } from '../../forms';

export class ResetPasswordService implements IResetPasswordServiceResolver {
    private readonly generatorService: GeneratorService;
    private readonly userGetRepository: UserGetRepository;
    private readonly ctx: ContextModel;

    constructor(ctx: ContextModel) {
        this.generatorService = new GeneratorService();
        this.userGetRepository = new UserGetRepository();
        this.ctx = ctx;
    }

    public async sendResetEmail(email: string): Promise<boolean> {
        return this.sendResetBy(email, 'email');
    }

    public async sendResetPhone(phone:string): Promise<boolean> {
        return this.sendResetBy(phone, 'phone');
    }

    private sendResetBy = async (emailOrPhone: string, type: string = 'email'): Promise<boolean> => {
        let user: User|undefined;
        if (type === 'email') {
            validateEmail(emailOrPhone);
            user = await this.userGetRepository.getUserByEmail(emailOrPhone, UserFragment);
        } else if (type === 'phone') {
            validatePhone(emailOrPhone);
            user = await this.userGetRepository.getUserByPhone(emailOrPhone.replace(/^\++/, ''), UserFragment);
        } else {
            throw new Error('No errors are provided.');
        }

        if (!user) {
            throw new Error(`Invalid ${type} is provided.`);
        }

        const _fields: ResetPasswordForm = {
            emailFields: {
                email_verify_token: uuidv4() + '-' + (+new Date()),
            },
            phoneFields: {
                phone_verify_token: (Math.floor(Math.random() * 90000) + 10000).toString(),
                phone_verify_token_expire: moment().add(5, 'minutes').format('Y-M-D H:mm:ss'),
            }
        };

        const { verification } = await updateUser(user.id, {}, _fields[type === 'email' ? 'emailFields' : 'phoneFields']);

        if (!verification) {
            return this.revertChanges(user, type);
        }

        if (type === 'email') {
            await (new Mail(user.username, user.email, verification.email_verify_token)).sendEmailResetToken();
        }
        if (type === 'phone') {
            await (new Sms(user.phone, verification.phone_verify_token)).sendSmsResetToken();
        }
        return true;
    }

    public async resetViaEmail(token: string, newPassword: string): Promise<GeneratorModel|boolean> {
        const values: ResetViaEmailModel = validateResetViaEmail(token, newPassword);

        const user = await this.userGetRepository.getUserByEmailVerifyToken(values.token);

        if (!user) {
            throw new Error('Invalid token.');
        }
        return this.resetPasswordBy(user, newPassword, 'email');
    }

    public async resetViaPhone(phone: string, token: string, newPassword: string): Promise<GeneratorModel|boolean> {
        const values: ResetViaPhoneModel = validateResetViaPhone(phone, token, newPassword);
        values.phone = values.phone.replace(/^\++/, '');

        const user = await this.userGetRepository.getUserByPhoneVerifyToken(values.phone);

        if (!user) {
            throw new Error('Invalid phone.');
        }

        const userVerification: UserVerification = user.user_verifications[0];

        if (userVerification.phone_verify_token !== values.token) {
            throw new Error('Invalid token.');
        }

        const expireData = moment(userVerification.phone_verify_token_expire);
        if (expireData.isBefore()) {
            throw new Error('Phone reset token is expired.');
        }

        return this.resetPasswordBy(user, newPassword, 'phone');
    }

    private async resetPasswordBy(user: User, newPassword: string, type: string = 'email'): Promise<GeneratorModel|boolean> {
        let passwordHash = await bcrypt.hash(newPassword, 10);

        const _fields: VerificationForm = {
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

        const result = await updateUser(user.id, {password: passwordHash}, _fields[type === 'email' ? 'emailFields' : 'phoneFields']);

        if (result.user && result.verification) {
            return this.generatorService.generateTokens(user, this.ctx.req, this.ctx.res);
        }

        return this.revertChanges(user, type);
    }

    private revertChanges = async (user: User, type: string = 'email'): Promise<boolean> => {
        const _fields: ResetPasswordForm = {
            emailFields: {
                email_verify_token: null,
            },
            phoneFields: {
                phone_verify_token: null,
                phone_verify_token_expire: null,
            },
        };

        await updateUser(user.id, {password: user.password}, _fields[type === 'email' ? 'emailFields' : 'phoneFields']);

        return false;
    }
}