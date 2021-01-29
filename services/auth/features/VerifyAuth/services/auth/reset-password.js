import {Generator} from "../../../BasicAuth/services/auth/generator";

const moment = require('moment');
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import get from 'lodash/get';

import {
	validateEmail,
	validatePhone,
	validateResetViaEmail,
	validateResetViaPhone,
} from '../../validators';
import { GetUser, updateUser } from '..';
import { UserFragment } from '../../fragments';
import { Mail } from '../mail';
import { Sms } from '../sms';

export class ResetPassword {
	generator;
	getUser;
	user;
	email;
	phone;
	token;
	password;
	ctx;

	constructor({email = null, phone = null, token = null, password = null, ctx}) {
		this.generator = new Generator();
		this.getUser = new GetUser();
		this.email = email;
		this.phone = phone ? phone.replace(/^\++/, '') : null;
		this.token = token;
		this.password = password;
		this.ctx = ctx;
	}

	async sendResetEmail() {
		return this.sendResetBy('email');
	}

	async sendResetPhone() {
		return this.sendResetBy('phone');
	}

	async sendResetBy(type = 'email') {
		if (this.email && this.phone) {
			throw new Error('Wrong parameters are provided.');
		}

		let user = null;
		if (this.email && type === 'email') {
			validateEmail(this.email);
			user = await this.getUser.getUserByEmail(this.email, UserFragment);
		} else if (this.phone && type === 'phone') {
			validatePhone(this.phone);
			user = await this.getUser.getUserByPhone(this.phone, UserFragment);
		} else {
			throw new Error('No parameters are provided.');
		}

		if (!user) {
			throw new Error(`Invalid ${type} provided`);
		}

		const _fields = {
			emailFields: {
				email_verify_token: uuidv4() + '-' + (+new Date()),
			},
			phoneFields: {
				phone_verify_token: (Math.floor(Math.random() * 90000) + 10000).toString(),
				phone_verify_token_expire: moment().add(5, 'minutes').format('Y-M-D H:mm:ss'),
			}
		};

		const result = await updateUser(user.id, {}, _fields[type + 'Fields']);

		let data = result.verification;

		if (data) {
			if (type === 'email') {
				await (new Mail(user.username, user.email, data.email_verify_token)).sendEmailResetToken();
			}
			if (type === 'phone') {
				await (new Sms(user.phone, data.phone_verify_token)).sendSmsResetToken();
			}
			return true;
		}
	}

	async resetViaEmail() {
		validateResetViaEmail(this.token, this.password);

		const user = await this.getUser.getUserByEmailVerifyToken(this.token);

		if (!user) {
			throw new Error('Invalid token');
		}

		return this.resetPasswordBy(user, 'email');
	}

	async resetViaPhone() {
		validateResetViaPhone(this.phone, this.token, this.password);

		const user = await this.getUser.getUserByPhoneVerifyToken(this.phone);

		if (!user) {
			throw new Error('Invalid phone');
		}
		const userVerification = user.user_verifications[0];

		if (userVerification.phone_verify_token !== this.token) {
			throw new Error('Invalid token');
		}

		const expireData = moment(userVerification.phone_verify_token_expire);
		if (expireData.isBefore()) {
			throw new Error('Phone reset token is expired.');
		}

		return this.resetPasswordBy(user, 'phone');
	}

	async resetPasswordBy(user, type = 'email') {
		let passwordHash = await bcrypt.hash(this.password, 10);
		const _fields = {
			emailFields: {
				email_verify_token: null,
			},
			phoneFields: {
				phone_verify_token: null,
				phone_verify_token_expire: null,
			}
		};

		const result = await updateUser(user.id, {password: passwordHash}, _fields[type + 'Fields']);

		if (result.user && result.verification) {
			return this.generator.generateTokens(user, this.ctx.req, this.ctx.res);
		}

		return this.revertChanges(user, type);
	}

	async revertChanges(user, type = 'email') {
		const _fields = {
			emailFields: {
				email_verify_token: null,
			},
			phoneFields: {
				phone_verify_token: null,
				phone_verify_token_expire: null,
			}
		};

		await updateUser(user.id, {password: user.password}, _fields[type + 'Fields']);

		return false;
	}
}
