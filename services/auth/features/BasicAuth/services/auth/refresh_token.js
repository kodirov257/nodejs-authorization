const moment = require('moment');
import get from 'lodash/get';
import { JWT } from 'jose';

import { getUserSession } from '../hasura/get-user-session';
import { getUserById } from '../hasura/get-user-by-id';
import { Generator } from './generator';

export class RefreshToken {
	generator;
	token;
	ctx;

	constructor(ctx) {
		this.generator = new Generator();
		this.ctx = ctx;
		const cookies = this.ctx.req.signedCookies;
		if ('refresh_token' in cookies) {
			this.token = cookies.refresh_token;
		} else {
			throw new Error('No refresh token is provided.');
		}
	}

	async refreshToken () {
		// const refreshToken = this.getToken(this.token);

		const userSession = await getUserSession(this.token);

		const expireData = moment(userSession.expires_at);
		if (!expireData.isAfter()) {
			throw new Error('Session is expired.');
		}

		const user = await getUserById(userSession.user_id);
		if (!user) {
			throw new Error('User is not found.');
		}
		// await this.generator.removeUserSession(user.id);

		return this.generator.generateTokens(user, this.ctx.req, this.ctx.res);
	}

	getToken = (refreshToken) => this.getFieldFromRefreshToken(refreshToken, 'token');

	getFieldFromRefreshToken = (refreshToken, field) => {
		const verifiedToken = this.getDataFromRefreshToken(refreshToken);
		// console.log(verifiedToken);

		return get(
			verifiedToken,
			`${field}`,
		);
	}

	getDataFromRefreshToken = (refreshToken) => {
		return JWT.verify(refreshToken, this.generator.jwtKey);
	}
}
