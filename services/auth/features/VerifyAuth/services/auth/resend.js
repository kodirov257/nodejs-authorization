const moment = require('moment');
import { v4 as uuidv4 } from 'uuid';
import get from 'lodash/get';

import { validateEmail, validatePhone } from '../../validators';
import { STATUS_VERIFIED } from '../../../../helpers/values';
import { updateUser } from '../hasura/update-user';
import { UserFragment } from '../../fragments';
import { GetUser } from '../hasura/get-user';
import { Mail } from '../mail';
import { Sms } from '../sms';

export class Resend {
	getUser;
	user;

	constructor({email = null, phone = null}) {
		this.getUser = new GetUser();
		if (email) {
			validateEmail(email);
			this.user = this.getUser.getUserByEmail(email, UserFragment);
		} else if (phone) {
			validatePhone(phone);
			this.user = this.getUser.getUserByPhone(phone, UserFragment);
		} else {
			throw new Error('No parameters are provided.');
		}
	}

	async resendBoth() {
		return (await this.resendVerificationBy('both')) || (await this.revertChanges('both'));
	}

	async resendEmail() {
		return (await this.resendVerificationBy('email')) || (await this.revertChanges('email'));
	}

	async resendPhone() {
		return (await this.resendVerificationBy('phone')) || (await this.revertChanges('phone'));
	}

	resendVerificationBy = async (type = 'email') => {
		const _fields = {
			emailFields: {
				email_verified: false,
				email_verify_token: uuidv4() + '-' + (+new Date()),
			},
			phoneFields: {
				phone_verified: false,
				phone_verify_token: (Math.floor(Math.random() * 90000) + 10000).toString(),
				phone_verify_token_expire: moment().add(5, 'minutes').format('Y-M-D H:mm:ss'),
			}
		};
		const user = await this.user;
		if (!user) {
			throw new Error(`Invalid ${type} provided`);
		}
		const result = await updateUser(user.id, {status: STATUS_VERIFIED}, _fields[type + 'Fields']);

		let data = get(result, 'data.update_user_verifications_by_pk');

		if (data !== undefined) {
			if (type === 'email' || type === 'both') {
				await (new Mail(user.username, user.email, data.email_verify_token)).sendEmailVerifyToken();
			}
			if (type === 'phone' || type === 'both') {
				await (new Sms(user.phone, data.phone_verify_token)).sendSmsVerifyToken();
			}
			return true;
		}
	}

	revertChanges = async (type = 'email') => {
		const _fields = {
			emailFields: {
				email_verified: true,
				email_verify_token: null,
			},
			phoneFields: {
				phone_verified: true,
				phone_verify_token: null,
				phone_verify_token_expire: null,
			}
		};
		const user = await this.user
		if (!user) {
			throw new Error(`Invalid ${type} provided`);
		}
		await updateUser(user.id, {status: user.status}, type === 'both' ?
			{..._fields.phoneFields, ..._fields.emailFields} :
			_fields[type + 'Fields']);

		return false;
	}
}
