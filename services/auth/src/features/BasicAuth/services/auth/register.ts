import { ValidationError } from 'apollo-server-express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

import { isEmail, isPhone, validateRegistration } from '../../../../core/validators';
import { BasicRegisterService } from '../../../../core/abstracts';
import { UserCreateForm, RegistrationForm } from '../../forms';
import * as constants from '../../../../core/helpers/values';
import { UserGetRepository } from '../../repositories';
import { UserFragment } from '../../fragments';
import { User } from '../../../../core/models';

export class Register extends BasicRegisterService<User, UserCreateForm, UserGetRepository> {
    public constructor(username: string, login: string, password: string) {
        super(username, login, password, UserFragment, new UserGetRepository());
    }

    protected validateForm = (): RegistrationForm => {
        return validateRegistration(this.username, this.login, this.password);
    }

    protected getUserByUsername = async (): Promise<User|undefined> => {
        return await this.userGetService.getUserByUsername(this.username, this.fragment);
    }

    protected getUserByEmail = async (): Promise<User|undefined> => {
        return await this.userGetService.getUserByEmail(this.login, this.fragment);
    }

    protected getUserByPhone = async (): Promise<User|undefined> => {
        return await this.userGetService.getUserByPhone(this.login, this.fragment);
    }

    protected getUser = async (): Promise<User|undefined> => {
        if (isEmail(this.login)) {
            return this.getUserByEmail();
        } else if (isPhone(this.login)) {
            return this.getUserByPhone();
        } else {
            throw new ValidationError('Wrong email or phone is given.')
        }
    }

    protected getParams = async (): Promise<UserCreateForm> => {
        const passwordHash = await bcrypt.hash(this.password, 10);

        return {
            username: this.username.replace(/ /g, ''),
            email: isEmail(this.login) ? this.login : null,
            phone: isPhone(this.login) ? this.login : null,
            password: passwordHash,
            role: constants.ROLE_USER,
            secret_token: uuidv4() + '-' + (+new Date()),
            status: constants.STATUS_ACTIVE,
        }
    }

    public override async register(): Promise<User> {
        return super.register();
    }
}