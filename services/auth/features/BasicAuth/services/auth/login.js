import { v4 as uuidv4 } from 'uuid';
import gql from 'graphql-tag';
import get from 'lodash/get';

import { generateClaimsJwtToken, generateJwtRefreshToken } from '../../../../core/helpers/auth-tools';
import { hasuraQuery } from '../../../../core/services';
import { GetUser } from '../hasura/get-user';

export class Signin {
	usernameEmailOrPhone;
	password;
	ctx;

	constructor(usernameEmailOrPhone, password, ctx) {
		this.usernameEmailOrPhone = usernameEmailOrPhone;
		this.password = password;
		this.ctx = ctx;
	}

	signin = async () => {
		const user = await (new GetUser()).getUserByCredentials(this.usernameEmailOrPhone, this.password);

		return this.generateTokens(user, this.ctx.req);
	}

	generateTokens = async (user, request) => {
		const ipAddress = (
			request.headers['x-forwarded-for'] || request.connection.remoteAddress || ''
		).split(',')[0].trim();

		const [refreshToken, sessionId] = await this.createUserSession(user, request.headers['user-agent'], ipAddress);

		const accessToken = await generateClaimsJwtToken(user, sessionId);

		return {
			access_token: accessToken,
			refresh_token: generateJwtRefreshToken({
				token: refreshToken,
			}),
			user_id: user.id,
		};
	}

	createUserSession = async (user, userAgent = null, ipAddress = null) => {
		const refreshToken = uuidv4() + '-' + (+new Date());
		try {
			const expiresAt = this.getExpiresDate();

			const result = await hasuraQuery(
				gql`
					mutation ($userSessionData: [user_sessions_insert_input!]!) {
						insert_user_sessions(objects: $userSessionData) {
							returning {
								id
							}
						}
					}
				`,
				{
					userSessionData: {
						user_id: user.id,
						expires_at: expiresAt,
						refresh_token: refreshToken,
						user_agent: userAgent,
						ip_address: ipAddress,
					}
				}
			);

			const sessionId = get(result, 'data.insert_user_sessions.returning[0].id');
			if (sessionId === undefined) {
				return Promise.reject(new Error('Error to create the user session.'));
			}

			return [refreshToken, sessionId];
		} catch (e) {
			throw new Error('Could not create "session" for user');
		}
	}

	getExpiresDate = () => {
		return new Date(Date.now() + process.env.REFRESH_TOKEN_EXPIRES_IN * 60 * 1000);
	}
}
