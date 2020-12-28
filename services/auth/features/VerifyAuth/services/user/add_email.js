import * as constants from '../../helpers/values';
import { v4 as uuidv4 } from 'uuid';
import get from 'lodash/get';

import { getCurrentUserId, isAuthenticated } from '../../../../core/helpers/user';
import { validateEmail, validateVerifyEmail } from '../../validators';
import { getUserById } from '../../../BasicAuth/services';
import { updateUser } from '../hasura/update-user';
import { UserFragment } from '../../fragments';
import { GetUser } from "../hasura/get-user";
import { Sms } from "../sms";

export class AddEmail {
	getUser;
	smsService;

	constructor() {
		this.getUser = new GetUser();
		this.smsService = new Sms();
	}

	sendEmailAddEmailToken = async (email, ctx) => {
		const value = validateEmail(email);
		email = value.email;

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

		if (user.email && user.email === email && user.email_verified === false) {
			return true;
		} else if (user.email && user.email_verified === true) {
			throw new Error('Email is already set.');
		}

		const anotherUser = await this.getUser.getUserByEmail(email);

		if (anotherUser && anotherUser.id !== user.id) {
			throw new Error('There is already active user with this email.');
		}

		const fields = {
			email: email,
			email_verify_token: uuidv4() + '-' + (+new Date()),
			email_verified: false,
		};

		const result = await updateUser(user.id, fields);
		let data = get(result, 'data.update_users_by_pk');

		if (data !== undefined) {
			await this.smsService.sendAddEmailToken(data.username, data.email, data.email_verify_token);

			return true;
		}

		return false;
	}

	addEmail = async (token, ctx) => {
		const value = validateVerifyEmail(token);
		token = value.token;

		if (!isAuthenticated(ctx.req)) {
			throw new Error('Authorization token has not provided');
		}

		const user = await this.getUser.getUserByEmailVerifyToken(token);

		if (!user) {
			throw new Error('Wrong token is provided.');
		}

		if (user.email_verify_token !== token) {
			throw new Error('Provided token is not equal to the current user.');
		}

		const fields = {
			email_verify_token: null,
			email_verified: true,
		};

		const result = await updateUser(user.id, fields);

		return get(result, 'data.update_users_by_pk') !== undefined;
	}
}
