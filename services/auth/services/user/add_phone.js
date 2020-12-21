const moment = require('moment');
import {getUserByPhone, getUserByPhoneVerifyToken} from "../hasura/get-user";
import { validatePhone, validateVerifyPhone } from "../../validators";
import { getCurrentUserId, isAuthenticated } from "./user";
import { getUserById } from "../hasura/get-user-by-id";
import { updateUser } from "../hasura/update-user";
import * as constants from "../../helpers/values";
import { sendSmsAddPhoneToken } from "../sms";
import get from "lodash/get";

export const sendAddPhoneToken = async (phone, ctx) => {
	const value = validatePhone(phone);
	phone = value.phone.replace(/^\++/, '');

	if (!isAuthenticated(ctx.req)) {
		throw new Error('Authorization token has not provided');
	}

	const currentUserId = getCurrentUserId(ctx.req);
	const user = await getUserById(currentUserId);

	if (!user) {
		throw new Error('User not found.');
	}

	if (user.status !== constants.STATUS_ACTIVE) {
		throw new Error('User not activated.');
	}

	if (user.phone) {
		throw new Error('Phone number is already set.');
	}

	const anotherUser = await getUserByPhone(phone);

	if (anotherUser) {
		throw new Error('There is already active user with this email.');
	}

	const fields = {
		phone: phone,
		phone_verify_token: (Math.floor(Math.random() * 90000) + 10000).toString(),
		phone_verify_token_expire: moment().add(5, 'minutes').format('Y-M-D H:mm:ss'),
		phone_verified: false,
	};

	const result = await updateUser(user.id, fields);
	let data = get(result, 'data.update_users_by_pk');

	if (data !== undefined) {
		await sendSmsAddPhoneToken(phone, data.phone_verify_token);

		return true;
	}

	return false;
}

export const addPhone = async (phone, token, ctx) => {
	const value = validateVerifyPhone(phone, token);
	phone = value.phone.replace(/^\++/, '');
	token = value.token;

	if (!isAuthenticated(ctx.req)) {
		throw new Error('Authorization token has not provided');
	}

	const user = await getUserByPhoneVerifyToken(phone);

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
