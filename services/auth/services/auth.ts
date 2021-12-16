import { v4 as uuid4 } from 'uuid';
import gql from 'graphql-tag';

import { User, UserSession } from '../models';
import { hasuraQuery } from './client';
import {UserSessionFragment} from "../fragments";

export const createUserSession = async (user: User, userAgent: string|null = null,
                                        ipAddress: string|null = null): Promise<{refreshToken: string, sessionId: string}> => {
    const refreshToken: string = uuid4();
    try {
        console.log({
            user_id: user.id,
            expires_at: getExpireDate(),
            refresh_token: refreshToken,
            user_agent: userAgent,
            ip_address: ipAddress,
        });

        const expiresAt = getExpireDate();

        const result = await hasuraQuery<{insert_auth_user_sessions: {returning: UserSession[]}}>(
            gql`
                ${UserSessionFragment}
                mutation ($userSessionData: [auth_user_sessions_insert_input!]!) {
                    insert_auth_user_sessions(objects: $userSessionData) {
                        returning {
                            ...UserSession
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

        const session: UserSession|undefined = result.data?.insert_auth_user_sessions.returning[0] ?? undefined;
        if (session === undefined) {
            return Promise.reject(new Error('Error to create the user session.'));
        }

        return {refreshToken, sessionId: session.id};
    } catch (e: any) {
        throw new Error('Could not create "session" for user');
    }
}

export const getExpireDate = () => {
    return new Date(Date.now() + (+process.env.REFRESH_TOKEN_EXPIRES_IN!) * 60 * 1000);
}