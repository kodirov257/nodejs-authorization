import { hasuraQuery } from './client';
import gql from 'graphql-tag';
import get from 'lodash/get';
import {v4 as uuidv4} from "uuid";

import { UserSessionFragment } from '../fragments';

export const createUserSession = async (user, userAgent = null, ipAddress = null) => {
    const refreshToken = uuidv4();
    try {
        console.log({
            user_id: user.id,
            expires_at: getExpiresDate(),
            refresh_token: refreshToken,
            user_agent: userAgent,
            ip_address: ipAddress,
        });
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

        console.log(result);

        const sessionId = get(result, 'data.insert_user_sessions.returning[0].id');
        console.log(result);
        if (sessionId === undefined) {
            return Promise.reject(new Error('Error to create the user session.'));
        }

        return [refreshToken, sessionId];
    } catch (e) {
        throw new Error('Could not create "session" for user');
    }
}

export const getExpiresDate = () => {
    return new Date(Date.now() + process.env.REFRESH_TOKEN_EXPIRES_IN * 60 * 1000);
};