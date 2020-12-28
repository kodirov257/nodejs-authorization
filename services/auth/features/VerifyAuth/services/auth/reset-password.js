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
import { Mail } from '../mail';
import { Sms } from '../sms';

export class ResetPassword {
	getUser;

	constructor() {
		this.getUser = new GetUser();
	}

	async sendResetEmail(email) {
		const value = validateEmail(email);
		email = value.email;

		let user = await this.getUser.getUserByEmail(email);

		if (!user) {
			throw new Error('Invalid email provided');
		}

		const fields = {
			email_verify_token: uuidv4() + '-' + (+new Date()),
		};

		const result = await updateUser(user.id, {}, fields);

		let data = get(result, 'data.update_user_verifications_by_pk');

		if (data !== undefined) {
			// const userVerificationData =;
			await (new Mail(data.username, data.email, data.email_verify_token)).sendEmailResetToken();

			return true;
		}

		return false;
	}

	async sendResetPhone(phone) {
		const value = validatePhone(phone);
		phone = value.phone

		let user = await this.getUser.getUserByPhone(phone);

		if (!user) {
			throw new Error('Invalid phone provided');
		}

		const fields = {
			phone_verify_token: (Math.floor(Math.random() * 90000) + 10000).toString(),
			phone_verify_token_expire: moment().add(5, 'minutes').format('Y-M-D H:mm:ss'),
		};

		const result = await updateUser(user.id, {}, fields)

		let data = get(result, 'data.update_user_verifications_by_pk');

		if (data !== undefined) {
			await (new Sms(data.phone, data.phone_verify_token)).sendSmsResetToken();

			return true;
		}

		return false;
	}

	async resetViaEmail(token, password) {
		validateResetViaEmail(token, password);

		let user = await this.getUser.getUserByEmailVerifyToken(token);

		if (!user) {
			throw new Error('Invalid token');
		}

		let passwordHash = await bcrypt.hash(password, 10);
		const fields = {
			email_verify_token: null,
			password: passwordHash,
		};

		const result = await updateUser(user.id, fields);

		if (get(result, 'data.update_users_by_pk') !== undefined && get(result, 'data.update_user_verifications_by_pk') !== undefined) {
			return true;
		}

		await updateUser(user.id, {password: user.password}, {email_verify_token: null});

		return false;
	}

	async resetViaPhone(phone, token, password) {
		validateResetViaPhone(phone, token, password);

		let user = await this.getUser.getUserByPhoneVerifyToken(phone);

		if (!user) {
			throw new Error('Invalid phone');
		}

		if (user.phone_verify_token !== token) {
			throw new Error('Invalid token');
		}

		const expireData = moment(user.phone_verify_token_expire);
		if (expireData.isBefore()) {
			throw new Error('Phone reset token is expired.');
		}

		const passwordHash = await bcrypt.hash(password, 10);
		const fields = {
			phone_verify_token: null,
			phone_verify_token_expire: null,
			password: passwordHash,
		};

		const result = await updateUser(user.id, fields)

		if (get(result, 'data.update_users_by_pk') !== undefined && get(result, 'data.update_user_verifications_by_pk') !== undefined) {
			return true;
		}

		await updateUser(user.id, {password: user.password}, {phone_verify_token: null, phone_verify_token_expire: null});

		return false;
	}
}
