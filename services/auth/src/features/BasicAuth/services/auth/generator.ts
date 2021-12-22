import { Request, Response } from 'express';
import { v4 as uuid4 } from 'uuid';
import gql from 'graphql-tag';

import { generateClaimsJwtToken, generateJwtRefreshToken } from '../../../../core/helpers/auth-tool';
import { UserSessionFragment } from '../../../../core/fragments';
import { User, UserSession } from '../../../../core/models';
import { hasuraQuery } from '../../../../core/services';

export class Generator {
    public generateTokens = async (user: User, request: Request|null = null, response: Response|null = null) => {
        let ipAddress: string|null = null;
        if (request) {
            const remoteAddress: string = <string>(request.headers['x-forwarded-for'] || request.socket.remoteAddress || '');
            ipAddress = remoteAddress.split(',')[0] ?? '';
            ipAddress = ipAddress.trim();
        }
        const userAgent: string|null = request?.headers['user-agent'] ?? null;

        const { refreshToken, sessionId } = await this.createUserSession(user, userAgent, ipAddress ?? null);

        const accessToken = generateClaimsJwtToken(user, sessionId);

        return {
            access_token: accessToken,
            refresh_token: generateJwtRefreshToken({
                token: refreshToken,
            }),
            user_id: user.id,
        };
    }

    public createUserSession = async (user: User, userAgent: string|null = null,
                               ipAddress: string|null = null): Promise<{refreshToken: string, sessionId: string}> => {
        const refreshToken: string = uuid4();
        try {
            const expiresAt = this.getExpireDate();

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

            const session: UserSession|undefined = result.data?.insert_auth_user_sessions.returning[0] ?? undefined;
            if (session === undefined) {
                return Promise.reject(new Error('Error to create the user session.'));
            }

            return {refreshToken, sessionId: session.id};
        } catch (e: any) {
            throw new Error('Could not create "session" for user');
        }
    }

    private getExpireDate = () => {
        return new Date(Date.now() + (+process.env.REFRESH_TOKEN_EXPIRES_IN!) * 60 * 1000);
    }
}