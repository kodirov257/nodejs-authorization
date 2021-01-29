import gql from 'graphql-tag';
import get from 'lodash/get';

import { hasuraQuery } from '../../../../core/services';
import { UserFragment } from '../../fragments';

export const getUserById = async (id, fragment = UserFragment) => {
  try {
    const response = await hasuraQuery(
      gql`
          ${fragment}
          query($id: bigint!) {
              auth_users_by_pk(id: $id) {
                  ...User
              }
          }
      `,
      {id},
    );

    return get(response, 'data.auth_users_by_pk') || undefined;
  } catch (e) {
    throw new Error('Unable to find the user');
  }
};
