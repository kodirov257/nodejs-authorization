const moment = require('moment');
import get from 'lodash/get';

import { validateVerifyEmail, validateVerifyPhone } from '../../validators';
import { Generator } from '../../../BasicAuth/services/auth/generator';
import * as constants from '../../helpers/values';
import { GetUser, updateUser } from '../index';

export class Verify {
	generator;
	getUser;
	token;
	phone;
	ctx;

	constructor({token, phone = null, ctx}) {
		this.generator = new Generator();
		this.getUser = new GetUser();
		this.token = token;
		this.phone = phone ? phone.replace(/^\++/, '') : null;
		this.ctx = ctx;
	}

	async verifyEmail() {
		validateVerifyEmail(this.token);

		let user = await this.getUser.getUserByEmailVerifyToken(this.token);

		if (!user) {
			throw new Error('Invalid token');
		}

		return this.verify(user, 'email');
	}

	async verifyPhone() {
		validateVerifyPhone(this.phone, this.token);

		let user = await this.getUser.getUserByPhoneVerifyToken(this.phone);

		if (!user) {
			throw new Error('Invalid phone');
		}

		return this.verify(user, 'phone');
	}

	validate = (user, type = 'email') => {
		const userVerifications = user.user_verifications[0];

		if (!userVerifications) {
			throw new Error('No user verification is provided.');
		}

		if (type === 'phone') {
			if (userVerifications.phone_verify_token !== this.token) {
				throw new Error('Invalid token');
			}

			const expireData = moment(userVerifications.phone_verify_token_expire);
			if (expireData.isBefore()) {
				throw new Error('Phone verify token is expired.');
			}
		}
	}

	async verify(user, type = 'email') {
		this.validate(user, type);

		const fields = {
			status: constants.STATUS_ACTIVE,
			updated_at: moment().format('Y-M-D H:mm:ss'),
		};

		const _verificationFields = {
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

		const result = await updateUser(user.id, fields, _verificationFields[type + 'Fields']);

		if (result.user && result.verification) {
			return this.generator.generateTokens(user, this.ctx.req, this.ctx.res);
		}

		return this.revertChanges(user, user.user_verifications[0], type);
	}

	async revertChanges(user, verification, type = 'email') {
		const _fields = {
			emailFields: {
				email_verified: verification.email_verified,
				email_verify_token: verification.email_verify_token,
			},
			phoneFields: {
				phone_verified: false,
				phone_verify_token: null,
				phone_verify_token_expire: null,
			}
		};

		await updateUser(user.id, {status: user.status, updated_at: moment().format('Y-M-D H:mm:ss')}, _fields[type + 'Fields']);

		return false;
	}
}
