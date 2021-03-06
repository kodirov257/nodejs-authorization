const moment = require('moment');
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

import { isEmail, isPhone, validateRegistration } from '../../validators';
import { Register as BasicRegister } from '../../../BasicAuth/services';
import { ValidationError } from 'apollo-server-express';
import { Mail, Sms, GetUser } from '../../services';
import * as constants from '../../helpers/values';
import { ROLE_USER } from '../../helpers/values';
import { UserFragment } from '../../fragments';

export class Register extends BasicRegister {
	constructor(login, password) {
		super(login, password);
		this.fragment = UserFragment;
		this.getUserService = new GetUser();
	}

	validate = () => {
		return validateRegistration(this.login, this.password);
	}

	getUserByUsername = async () => {
		return this.getUserService.getUserByUsername(this.login, this.fragment);
	}

	getUserByEmail = async () => {
		return this.getUserService.getUserByEmail(this.login, this.fragment);
	}

	getUserByPhone = async () => {
		return this.getUserService.getUserByPhone(this.login, this.fragment);
	}

	getUser = async () => {
		if (isEmail(this.login)) {
			return await this.getUserByEmail();
		} else if (isPhone(this.login)) {
			return this.getUserByPhone();
		}
		throw new ValidationError('Wrong email or phone is given.');
	}

	getParams = async () => {
		let verificationParams = {};
		if (isEmail(this.login)) {
			verificationParams.email_verify_token = uuidv4() + '-' + (+new Date());
		} else {
			verificationParams.phone_verify_token = (Math.floor(Math.random() * 90000) + 10000).toString();
			verificationParams.phone_verify_token_expire = moment().add(5, 'minutes').format('Y-M-D H:mm:ss');
		}

		const passwordHash = await bcrypt.hash(this.password, 10);

		return {
			username: `${ROLE_USER}${moment().unix()}`,
			email: isEmail(this.login) ? this.login : null,
			phone: isPhone(this.login) ? this.login.replace(/^\++/, '') : null,
			password: passwordHash,
			role: constants.ROLE_USER,
			secret_token: uuidv4() + '-' + (+new Date()),
			status: constants.STATUS_VERIFIED,
			user_verifications: {
				data: [verificationParams],
			},
		};
	}

	async register () {
		if (await super.register()) {
			let data;
			if ((data = this.registerData[0]) !== undefined) {
				const userVerificationData = data.user_verifications[0];
				if (data.email) {
					await (new Mail(data.username, data.email, userVerificationData.email_verify_token)).sendEmailVerifyToken();
				} else {
					await (new Sms(data.phone, userVerificationData.phone_verify_token)).sendSmsVerifyToken();
				}

				return true;
			}
		}

		return false;
	}
}
