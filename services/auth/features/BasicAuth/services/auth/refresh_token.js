const moment = require('moment');
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import get from 'lodash/get';

import { generateClaimsJwtToken } from '../../../../core/helpers/auth-tools';
import { getUserSession } from '../hasura/get-user-session';
import { getUserById } from '../hasura/get-user-by-id';

export class RefreshToken {
	token;
	ctx;

	constructor(refreshToken, ctx) {
		this.ctx = ctx;
		this.token = refreshToken;
	}

	async refreshToken () {
		const refreshToken = this.getToken(this.token);

		const userSession = await getUserSession(refreshToken);

		const expireData = moment(userSession.expires_at);
		if (!expireData.isAfter()) {
			throw new Error('Session is expired.');
		}

		const user = await getUserById(userSession.user_id);
		const accessToken = await generateClaimsJwtToken(user, uuidv4() + '-' + (+new Date()));

		return {
			access_token: accessToken,
		};
	}

	getToken = (refreshToken) =>
		this.getFieldFromRefreshToken(refreshToken, 'token');

	getFieldFromRefreshToken = (refreshToken, field) => {
		const verifiedToken = this.getDataFromRefreshToken(refreshToken);

		return get(
			verifiedToken,
			`${field}`,
		);
	}

	getDataFromRefreshToken = (refreshToken) => {
		return jwt.verify(refreshToken, process.env.JWT_PRIVATE_REFRESH_KEY);
	}
}
