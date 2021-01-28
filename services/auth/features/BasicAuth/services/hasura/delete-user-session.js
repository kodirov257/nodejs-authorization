import gql from 'graphql-tag';

import { hasuraQuery } from '../../../../core/services';
import { UserSessionFragment } from '../../fragments';

export const deleteUserSession = async (id) => {
  try {
    const response = await hasuraQuery(
      gql`
          ${UserSessionFragment}
          mutation ($where: auth_user_sessions_bool_exp!) {
              delete_auth_user_sessions(where: $where) {
                  returning {
                      ...UserSession
                  }
              }
          }
      `,
      {
        where: {
          user_id: { _eq: id },
        }
      }
    );

    console.log(response);
    console.log(response.data);

    return response.data.delete_auth_user_sessions[0] === undefined;
  } catch (e) {
    throw new Error('Could not delete the user');
  }
}
