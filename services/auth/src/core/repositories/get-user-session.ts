import gql from 'graphql-tag';

import { UserSessionFragment } from '../fragments';
import { hasuraQuery } from '../helpers/client';
import { UserSession } from '../models';

export const getUserSession = async (refreshToken: string): Promise<UserSession|undefined> => {
    try {
        const response = await hasuraQuery<{auth_user_sessions: UserSession[]}>(
            gql`
                ${UserSessionFragment}
                query GetSession($where: auth_user_sessions_bool_exp) {
                    auth_user_sessions(where: $where) {
                        ...UserSession
                    }
                }
            `,
            {
                where: {
                    refresh_token: { _eq: refreshToken },
                },
            }
        );

        return response.data?.auth_user_sessions[0];
    } catch (e: any) {
        throw new Error(e.message);
    }
}