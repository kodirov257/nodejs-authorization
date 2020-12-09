import { v4 as uuidv4 } from "uuid";
import gql from "graphql-tag";
import get from "lodash/get";

import { hasuraQuery } from "../client";
import {getUserByCredentials} from "..";
import {generateClaimsJwtToken, generateJwtRefreshToken} from "../../helpers/auth-tools";

export const createUserSession = async (user, userAgent = null, ipAddress = null) => {
    const refreshToken = uuidv4() + '-' + (+new Date());
    try {
        const expiresAt = getExpiresDate();

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

export const login = async (usernameEmailOrPhone, password, ctx) => {
    const user = await getUserByCredentials(usernameEmailOrPhone, password);

    return generateTokens(user, ctx.req);
}

export const generateTokens = async (user, request) => {
    const ipAddress = (
        request.headers['x-forwarded-for'] || request.connection.remoteAddress || ''
    ).split(',')[0].trim();

    const [refreshToken, sessionId] = await createUserSession(user, request.headers['user-agent'], ipAddress);

    const accessToken = await generateClaimsJwtToken(user, sessionId);

    return {
        access_token: accessToken,
        refresh_token: generateJwtRefreshToken({
            token: refreshToken,
        }),
        user_id: user.id,
    };
}

export const getExpiresDate = () => {
    return new Date(Date.now() + process.env.REFRESH_TOKEN_EXPIRES_IN * 60 * 1000);
};