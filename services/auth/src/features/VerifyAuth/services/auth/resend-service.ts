import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

import { IResendServiceResolver } from '../../../../core/resolvers';
import { updateUser, UserGetRepository } from '../../repositories';
import { validateEmail, validatePhone } from '../../validators';
import { STATUS_VERIFIED } from '../../helpers/values';
import { User, UserVerification } from '../../models';
import { VerificationForm } from '../../forms';
import { UserFragment } from '../../fragments';
import { MailService } from '../mail-service';
import { SmsService } from '../sms-service';

export class ResendService implements IResendServiceResolver {
    private readonly email: string | null;
    private readonly phone: string | null;
    private userGetRepository: UserGetRepository;

    constructor({email = null, phone = null}: {email?: string|null, phone?: string|null}) {
        this.email = email;
        this.phone = phone;

        this.userGetRepository = new UserGetRepository();
    }

    public async resendBoth(): Promise<boolean> {
        return this.resendVerificationBy('both');
    }

    public async resendEmail(): Promise<boolean> {
        return await this.resendVerificationBy('email');
    }

    public async resendPhone(): Promise<boolean> {
        return await this.resendVerificationBy('phone');
    }

    private resendVerificationBy = async (type: string = 'email'): Promise<boolean> => {
        const _fields: VerificationForm = {
            emailFields: {
                email_verified: false,
                email_verify_token: uuidv4() + '-' + (+new Date()),
            },
            phoneFields: {
                phone_verified: false,
                phone_verify_token: (Math.floor(Math.random() * 90000) + 10000).toString(),
                phone_verify_token_expire: moment().add(5, 'minutes').format('Y-M-D H:mm:ss'),
            },
        };

        const user: User|undefined = await this.getUser({email: this.email, phone: this.phone});
        if (!user) {
            throw new Error(`Invalid ${type} provided.`);
        }

        const result = await updateUser(user.id, {status: STATUS_VERIFIED}, _fields[type === 'email' ? 'emailFields' : 'phoneFields']);

        let verification: UserVerification|undefined = result.verification;

        if (!verification) {
            return this.revertChanges(user, type);
        }

        if (type === 'email' || type === 'both') {
            await (new MailService(user.username, user.email, verification.email_verify_token)).sendEmailVerifyToken();
        }
        if (type === 'phone' || type === 'both') {
            await (new SmsService(user.phone, verification.phone_verify_token)).sendSmsVerifyToken();
        }

        return true;
    }

    private revertChanges = async (user: User, type: string = 'email'): Promise<boolean> => {
        const verification: UserVerification = user.user_verifications[0];
        const _fields: VerificationForm = {
            emailFields: {
                email_verified: verification.email_verified,
                email_verify_token: verification.email_verify_token,
            },
            phoneFields: {
                phone_verified: verification.phone_verified,
                phone_verify_token: verification.phone_verify_token,
                phone_verify_token_expire: verification.phone_verify_token_expire,
            },
        };

        await updateUser(user.id, {status: user.status}, type === 'both' ?
            {..._fields.phoneFields, ..._fields.emailFields} :
            _fields[type === 'email' ? 'emailFields' : 'phoneFields']
        );

        return false;
    }

    private getUser = async ({email, phone}: {email: string|null, phone: string|null}): Promise<User|undefined> => {
        if (email) {
            validateEmail(email);
            return this.userGetRepository.getUserByEmail(email, UserFragment);
        } else if (phone) {
            validatePhone(phone);
            return this.userGetRepository.getUserByPhone(phone, UserFragment);
        } else {
            throw new Error('No parameters are provided.');
        }
    }
}