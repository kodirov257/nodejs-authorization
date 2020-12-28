const moment = require('moment');
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

import { isEmail, isPhone, validateRegistration } from '../../validators';
import { Register as BasicRegister } from '../../../BasicAuth/services';
import { Mail, Sms, GetUser } from '../../services';
import * as constants from '../../helpers/values';
import { UserFragment } from '../../fragments';

export class Register extends BasicRegister {
	constructor(username, emailOrPhone, password) {
		super(username, emailOrPhone, password);
		this.fragment = UserFragment;
		this.getUser = new GetUser();
	}

	validate = () => {
		return validateRegistration(this.username, this.emailOrPhone, this.password);
	}

	getUserByUsername = async () => {
		return await this.getUser.getUserByUsername(this.username, this.fragment);
	}

	getUserByEmail = async () => {
		return await this.getUser.getUserByEmail(this.emailOrPhone, this.fragment);
	}

	getUserByPhone = async () => {
		return await this.getUser.getUserByPhone(this.emailOrPhone, this.fragment);
	}

	getParams = async () => {
		let verificationParams = {};
		if (isEmail(this.emailOrPhone)) {
			verificationParams.email_verify_token = uuidv4() + '-' + (+new Date());
		} else {
			verificationParams.phone_verify_token = (Math.floor(Math.random() * 90000) + 10000).toString();
			verificationParams.phone_verify_token_expire = moment().add(5, 'minutes').format('Y-M-D H:mm:ss');
		}

		const passwordHash = await bcrypt.hash(this.password, 10);

		return {
			username: this.username.replace(/ /g, ''),
			email: isEmail(this.emailOrPhone) ? this.emailOrPhone : null,
			phone: isPhone(this.emailOrPhone) ? this.emailOrPhone.replace(/^\++/, '') : null,
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
			console.log(this.registerData[0]);
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
