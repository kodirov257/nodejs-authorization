const moment = require('moment');
import get from 'lodash/get';
import { JWT } from 'jose';

import { deleteUserSession } from '../hasura/delete-user-session';
import { getUserSession } from '../hasura/get-user-session';
import { getUserById } from '../hasura/get-user-by-id';
import { Generator } from './generator';

export class RefreshToken {
	generator;
	token;
	ctx;

	constructor(refreshToken, ctx) {
		this.generator = new Generator();
		this.token = refreshToken;
		this.ctx = ctx;
	}

	async refreshToken () {
		const refreshToken = this.getToken(this.token);

		const userSession = await getUserSession(refreshToken);

		const expireData = moment(userSession.expires_at);
		if (!expireData.isAfter()) {
			throw new Error('Session is expired.');
		}

		const user = await getUserById(userSession.user_id);
		await this.removeUserSession(user.id);

		return this.generator.generateTokens(user, this.ctx.req);
	}

	removeUserSession = async (userId) => {
		return deleteUserSession(userId);
	}

	getToken = (refreshToken) => this.getFieldFromRefreshToken(refreshToken, 'token');

	getFieldFromRefreshToken = (refreshToken, field) => {
		const verifiedToken = this.getDataFromRefreshToken(refreshToken);
		console.log(verifiedToken);

		return get(
			verifiedToken,
			`${field}`,
		);
	}

	getDataFromRefreshToken = (refreshToken) => {
		return JWT.verify(refreshToken, this.generator.jwtKey);
	}
}
