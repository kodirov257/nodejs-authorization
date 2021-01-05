const moment = require('moment');

import { validatePhone, validateVerifyPhone } from '../../validators';
import { AddInfo } from './add_info';
import { Sms } from '../sms';

export class AddPhone extends AddInfo {
	constructor({phone, token = null, ctx}) {
		super({phone, token, ctx});
		this.smsService = Sms;
	}

	sendAddPhoneToken = async () => {
		validatePhone(this.phone);

		return this.sendAddInfoToken('phone');
	}

	addPhone = async () => {
		const value = validateVerifyPhone(this.phone, this.token);
		this.token = value.token;

		return this.addInfo('phone');
	}

	validateAdd = (verification) => {
		if (verification.phone_verify_token !== this.token) {
			throw new Error('Provided token is not equal to the current user.');
		}

		const expireData = moment(verification.phone_verify_token_expire);
		if (expireData.isBefore()) {
			throw new Error(`Phone verify token is expired.`);
		}
	}

	getUserByToken = async () => this.getUser.getUserByPhoneVerifyToken(this.phone);

	getAnotherUser = async () => this.getUser.getUserByPhone(this.phone);
}
