const moment = require('moment');
import get from 'lodash/get';

import { getCurrentUserId, isAuthenticated } from '../../../../core/helpers/user';
import { validatePhone, validateVerifyPhone } from '../../validators';
import { getUserById } from '../../../BasicAuth/services';
import { updateUser } from '../hasura/update-user';
import * as constants from '../../helpers/values';
import { UserFragment } from '../../fragments';
import { GetUser } from '../hasura/get-user';
import { Sms } from '../sms';

export class AddPhone {
	getUser;
	smsService;

	constructor() {
		this.getUser = new GetUser();
		this.smsService = new Sms();
	}

	sendAddPhoneToken = async (phone, ctx) => {
		const value = validatePhone(phone);
		phone = value.phone.replace(/^\++/, '');

		if (!isAuthenticated(ctx.req)) {
			throw new Error('Authorization token has not provided');
		}

		const currentUserId = getCurrentUserId(ctx.req);
		const user = await getUserById(currentUserId, UserFragment);

		if (!user) {
			throw new Error('User not found.');
		}

		if (user.status !== constants.STATUS_ACTIVE) {
			throw new Error('User not activated.');
		}

		if (user.phone && user.phone === phone && user.phone_verified === false) {
			return this.updateAddPhone(user.id, phone);
		} else if (user.phone && user.phone_verified === true) {
			throw new Error('Phone number is already set.');
		}

		const anotherUser = await this.getUser.getUserByPhone(phone);

		if (anotherUser && anotherUser.id !== user.id) {
			throw new Error('There is already active user with this phone number.');
		}

		return this.updateAddPhone(user.id, phone);
	}

	updateAddPhone = async (userId, phone) => {
		const fields = {
			phone: phone,
			phone_verify_token: (Math.floor(Math.random() * 90000) + 10000).toString(),
			phone_verify_token_expire: moment().add(5, 'minutes').format('Y-M-D H:mm:ss'),
			phone_verified: false,
		};

		const result = await updateUser(userId, fields);
		let data = get(result, 'data.update_users_by_pk');

		if (data !== undefined) {
			await this.smsService.sendSmsAddPhoneToken(phone, data.phone_verify_token);

			return true;
		}

		return false;
	}

	addPhone = async (phone, token, ctx) => {
		const value = validateVerifyPhone(phone, token);
		phone = value.phone.replace(/^\++/, '');
		token = value.token;

		if (!isAuthenticated(ctx.req)) {
			throw new Error('Authorization token has not provided');
		}

		const user = await this.getUser.getUserByPhoneVerifyToken(phone);

		if (!user) {
			throw new Error('Wrong phone number is provided.');
		}

		if (user.phone_verify_token !== token) {
			throw new Error('Provided token is not equal to the current user.');
		}

		const fields = {
			phone_verify_token: null,
			phone_verify_token_expire: null,
			phone_verified: true,
		};

		const result = await updateUser(user.id, fields);

		return get(result, 'data.update_users_by_pk') !== undefined;
	}
}
