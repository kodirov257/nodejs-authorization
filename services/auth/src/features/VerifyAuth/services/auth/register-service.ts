import { ValidationError } from 'apollo-server-express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import moment from 'moment';

import { UserCreateForm, UserCreateVerificationForm } from '../../forms/user-create-form';
import { isEmail, isPhone, validateRegistration } from '../../validators';
import { IRegisterServiceResolver } from '../../../../core/resolvers';
import { BasicRegisterService } from '../../../../core/abstracts';
import { RegistrationForm } from '../../../../core/forms';
import { Mail } from '../../../BasicAuth/services/mail';
import { UserGetRepository } from '../../repositories';
import { User, UserVerification } from '../../models';
import { Sms } from '../../../BasicAuth/services/sms';
import * as constants from '../../helpers/values';
import { UserFragment } from '../../fragments';

export class RegisterService extends BasicRegisterService<User, UserCreateForm, UserGetRepository> implements IRegisterServiceResolver<User> {
    constructor(username: string, login: string, password: string) {
        super(username, login, password, UserFragment, new UserGetRepository());
    }

    protected override validateForm = (): RegistrationForm => {
        return validateRegistration(this.username, this.login, this.password);
    }

    public override getUserByUsername = async (): Promise<User|undefined> => {
        return this.userGetService.getUserByUsername(this.username, this.fragment);
    }

    public override getUserByEmail = async (): Promise<User|undefined> => {
        return this.userGetService.getUserByEmail(this.login, this.fragment);
    }

    public override getUserByPhone = async (): Promise<User|undefined> => {
        return this.userGetService.getUserByPhone(this.login, this.fragment);
    }

    public override getUser = async () => {
        if (isEmail(this.login)) {
            return await this.getUserByEmail();
        } else if (isPhone(this.login)) {
            return this.getUserByPhone();
        }
        throw new ValidationError('Wrong email or phone is given.');
    }

    public override getParams = async (): Promise<UserCreateForm> => {
        let verificationParams: UserCreateVerificationForm = {};

        if (isEmail(this.login)) {
            verificationParams.email_verify_token = uuidv4() + '-' + (+new Date());
        } else {
            verificationParams.phone_verify_token = (Math.floor(Math.random() * 90000) + 10000).toString();
            verificationParams.phone_verify_token_expire = moment().add(5, 'minutes').format('Y-M-D H:mm:ss');
        }

        const passwordHash = await bcrypt.hash(this.password, 10);

        return {
            username: this.username,
            email: isEmail(this.login) ? this.login : null,
            phone: isPhone(this.login) ? this.login : null,
            password: passwordHash,
            role: constants.ROLE_USER,
            secret_token: uuidv4() + '-' + (+new Date()),
            status: constants.STATUS_VERIFIED,
            user_verifications: {
                data: [verificationParams],
            }
        }
    }

    public override async register(): Promise<User> {
        await super.register();


        if (this.registerData === undefined) {
            throw new Error('User is not registered.');
        }

        const userVerificationData: UserVerification = this.registerData.user_verifications[0];
        if (this.registerData.email) {
            await (new Mail(this.registerData.username, this.registerData.email, userVerificationData.email_verify_token)).sendEmailVerifyToken();
        } else {
            await (new Sms(this.registerData.phone, userVerificationData.phone_verify_token)).sendSmsVerifyToken();
        }

        return this.registerData;
    }
}