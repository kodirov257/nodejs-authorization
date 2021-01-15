import gql from 'graphql-tag';
import get from 'lodash/get';

import { hasuraQuery } from '../../../../core/services';
import { UserSessionFragment } from '../../fragments';

export const getUserSession = async (refreshToken) => {
    try {
        const response = await hasuraQuery(
          gql`
              ${UserSessionFragment}
              query($where: auth_user_sessions_bool_exp) {
                  auth_user_sessions(where: $where) {
                      ...UserSession
                  }
              }
          `,
          {
              where: {
                  refresh_token: { _eq: refreshToken },
              },
          },
        );

        return get(response, 'data.auth_user_sessions[0]');
    } catch (e) {
        // throw new Error('Unable to find the email');
        throw new Error(e.message);
    }
}
